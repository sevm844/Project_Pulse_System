import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import { ApiError, apiFetch } from "./api";

// Live co-editing of the manuscript draft, over the normal API (no extra server).
//
// The document is a Yjs CRDT in every member's browser. Local changes are sent as small messages; the server stores them in order and hands them to the
// other members, whose browsers merge them, so two people typing at once never overwrite each other. This class is the "provider" the editor talks to:
// it sends my changes and my cursor, asks for everybody else's about once a second, and keeps trying when the network drops.

type SyncAnswer = {
  updates: { id: number; data: string }[];
  cursor: number;
  head: number;
  log_size: number;
  initialised: boolean;
  online: { user_id: number; name: string; data: string }[];
};

export type CollabStatus = "connecting" | "synced" | "syncing" | "offline" | "stopped";

const FAST_MS = 1000;
const SLOW_MS = 5000;
const SEND_SOON_MS = 250;
const AWARENESS_REFRESH_MS = 8000;
const COMPACT_AFTER = 150;

export const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));

  return btoa(binary);
};

export const fromBase64 = (text: string): Uint8Array => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

export class CollabProvider {
  readonly doc = new Y.Doc();
  readonly awareness = new Awareness(this.doc);
  /** The id of the last server message this browser has applied. */
  cursor = 0;
  status: CollabStatus = "connecting";

  private queue: Uint8Array[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private destroyed = false;
  private ready = false;
  private failures = 0;
  private lastAwarenessSent = 0;
  private awarenessDirty = true;
  private lastCompact = 0;
  private online = new Set<number>();
  // What I typed since the last time it was sent (for the adviser's and the Dean's daily activity view).
  private typed = { added: 0, removed: 0, minutes: 0 };
  private lastTypedMinute = 0;

  constructor(
    private readonly handlers: {
      onStatus?: (status: CollabStatus) => void;
      /** Something went wrong that retrying cannot fix (for example the group was closed). */
      onFatal?: (message: string) => void;
    } = {},
  ) {
    this.doc.on("update", this.onLocalUpdate);
    this.awareness.on("update", this.onAwarenessUpdate);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  /**
   * Read everything the server has. If the manuscript has never been opened for co-editing, `seed` makes the starting document from the saved draft
   * and it is offered to the server: only the first member's is accepted, so nobody gets the starting text twice.
   */
  async start(seed: () => Uint8Array): Promise<void> {
    try {
      let answer = await this.pullAll();

      if (!answer.initialised) {
        await apiFetch("/my-manuscript/collab/start", { method: "POST", body: JSON.stringify({ data: toBase64(seed()) }) });
        answer = await this.pullAll();
      }

      this.ready = true;
      this.setStatus("synced");
      this.schedule(FAST_MS);
    } catch (err) {
      this.fail(err);
      throw err;
    }
  }

  /** My own typing: characters added and removed by one edit. Counts the minute too (one per minute I am typing). */
  recordActivity(added: number, removed: number) {
    if (added + removed === 0) return;
    this.typed.added += added;
    this.typed.removed += removed;
    const minute = Math.floor(Date.now() / 60000);

    if (minute > this.lastTypedMinute) {
      this.lastTypedMinute = minute;
      this.typed.minutes += 1;
    }
  }

  /** Changes of mine that the server may not have yet. */
  get pending(): boolean {
    return this.queue.length > 0 || this.inFlight;
  }

  /** Send what is waiting and bring in what others sent, then say whether this browser is fully in step. */
  async flush(timeoutMs = 10000): Promise<boolean> {
    const until = Date.now() + timeoutMs;

    while (Date.now() < until && !this.destroyed) {
      if (!this.inFlight) {
        await this.tick();
        if (this.queue.length === 0 && this.status === "synced") return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return this.queue.length === 0 && !this.inFlight;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.timer) clearTimeout(this.timer);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.doc.off("update", this.onLocalUpdate);

    // Tell the others this cursor is gone (best effort), then free everything.
    this.awareness.setLocalState(null);
    void apiFetch("/my-manuscript/collab/sync", {
      method: "POST",
      body: JSON.stringify({ since: this.cursor, updates: this.queue.length ? [toBase64(Y.mergeUpdates(this.queue))] : [], awareness: null }),
      keepalive: true,
    }).catch(() => {});
    this.awareness.destroy();
    this.doc.destroy();
  }

  // ---- internals

  private setStatus(status: CollabStatus) {
    if (this.status === status) return;
    this.status = status;
    this.handlers.onStatus?.(status);
  }

  private readonly onLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return;
    this.queue.push(update);
    if (this.ready) {
      this.setStatus("syncing");
      this.schedule(SEND_SOON_MS);
    }
  };

  private readonly onAwarenessUpdate = (_changes: unknown, origin: unknown) => {
    if (origin === this) return;
    this.awarenessDirty = true;
    if (this.ready) this.schedule(SEND_SOON_MS);
  };

  private readonly onVisibility = () => {
    if (this.ready && document.visibilityState === "visible") this.schedule(0);
  };

  private schedule(ms: number) {
    if (this.destroyed) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.tick(), ms);
  }

  private async pullAll(): Promise<SyncAnswer> {
    let answer: SyncAnswer;

    do {
      answer = await this.exchange([], false);
    } while (answer.cursor < answer.head);

    return answer;
  }

  private async tick(): Promise<void> {
    if (this.destroyed || !this.ready || this.inFlight) return;

    const sending = this.queue.length ? Y.mergeUpdates(this.queue) : null;
    this.queue = [];
    // The typing is reported together with the changes it produced (the server ignores numbers that come alone).
    const activity = sending && this.typed.added + this.typed.removed > 0 ? this.typed : null;
    if (activity) this.typed = { added: 0, removed: 0, minutes: 0 };
    const awarenessDue = this.awarenessDirty || Date.now() - this.lastAwarenessSent > AWARENESS_REFRESH_MS;

    try {
      const answer = await this.exchange(sending ? [sending] : [], awarenessDue, activity);
      this.failures = 0;
      this.setStatus(this.queue.length === 0 && answer.cursor >= answer.head ? "synced" : "syncing");

      if (answer.cursor < answer.head) {
        this.schedule(0);
        return;
      }

      this.maybeCompact(answer);
    } catch (err) {
      // Nothing is lost: what could not be sent goes back to the front of the queue.
      if (sending) this.queue.unshift(sending);
      if (activity) {
        this.typed.added += activity.added;
        this.typed.removed += activity.removed;
        this.typed.minutes += activity.minutes;
      }
      this.fail(err);
      return;
    }

    this.schedule(document.visibilityState === "visible" ? (this.queue.length ? SEND_SOON_MS : FAST_MS) : SLOW_MS);
  }

  /** One round trip to the server. */
  private async exchange(
    updates: Uint8Array[],
    withAwareness: boolean,
    activity: { added: number; removed: number; minutes: number } | null = null,
  ): Promise<SyncAnswer> {
    this.inFlight = true;

    try {
      const body: Record<string, unknown> = { since: this.cursor, updates: updates.map(toBase64) };
      if (activity) body.activity = activity;

      if (withAwareness && this.awareness.getLocalState() !== null) {
        body.awareness = toBase64(encodeAwarenessUpdate(this.awareness, [this.doc.clientID]));
      }

      const answer = await apiFetch<SyncAnswer>("/my-manuscript/collab/sync", { method: "POST", body: JSON.stringify(body) });

      if (withAwareness) {
        this.awarenessDirty = false;
        this.lastAwarenessSent = Date.now();
      }

      this.doc.transact(() => {
        for (const update of answer.updates) Y.applyUpdate(this.doc, fromBase64(update.data), this);
      }, this);
      this.cursor = answer.cursor;
      this.showOthers(answer.online);

      return answer;
    } finally {
      this.inFlight = false;
    }
  }

  /** Other members' cursors: apply what the server relayed and drop the ones who left (or reloaded and got a new identity). */
  private showOthers(online: SyncAnswer["online"]) {
    const userOf = (clientId: number) => (this.awareness.getStates().get(clientId) as { user?: { userId?: number } } | undefined)?.user?.userId;
    const present = new Set<number>();

    for (const other of online) {
      const before = new Set(this.awareness.getStates().keys());

      try {
        applyAwarenessUpdate(this.awareness, fromBase64(other.data), this);
      } catch {
        continue;
      }

      present.add(other.user_id);
      const fresh = [...this.awareness.getStates().keys()].filter((id) => !before.has(id) && userOf(id) === other.user_id);
      // A reload gives the same person a new identity: remove the old cursor of that person.
      const stale = [...this.awareness.getStates().keys()].filter((id) => id !== this.doc.clientID && userOf(id) === other.user_id && !fresh.includes(id) && fresh.length > 0);
      if (stale.length) removeAwarenessStates(this.awareness, stale, this);
    }

    for (const id of this.online) {
      if (present.has(id)) continue;
      const gone = [...this.awareness.getStates().keys()].filter((clientId) => clientId !== this.doc.clientID && userOf(clientId) === id);
      if (gone.length) removeAwarenessStates(this.awareness, gone, this);
    }

    this.online = present;
  }

  /** Keep the server's log short: when this browser is fully in step, replace the old messages with one merged copy. */
  private maybeCompact(answer: SyncAnswer) {
    if (answer.log_size < COMPACT_AFTER || this.queue.length > 0 || this.cursor !== answer.head || Date.now() - this.lastCompact < 60000) return;
    this.lastCompact = Date.now();

    void apiFetch("/my-manuscript/collab/compact", {
      method: "POST",
      body: JSON.stringify({ upto: answer.head, data: toBase64(Y.encodeStateAsUpdate(this.doc)) }),
    }).catch(() => {});
  }

  private fail(err: unknown) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      this.setStatus("stopped");
      this.handlers.onFatal?.(err.message || "Co-editing is not available for this manuscript.");
      return;
    }

    this.failures += 1;
    this.setStatus("offline");
    if (this.ready) this.schedule(Math.min(2000 * this.failures, 10000));
  }
}

// A cursor colour for each person, the same on every screen: it comes from the account number.
const CURSOR_COLORS = ["#d9480f", "#1971c2", "#2f9e44", "#9c36b5", "#c2255c", "#0c8599", "#e67700", "#5f3dc4"];
export const cursorColor = (userId: number) => CURSOR_COLORS[Math.abs(userId) % CURSOR_COLORS.length];
