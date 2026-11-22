import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

// Letter paper at 96 dpi with 1 inch margins. The sheet is one long element; this draws the page boundaries into it
// (a grey gap, and the next page's top margin) and moves content that would cross a boundary to the
// next page, line by line for paragraphs. Nothing is added to the document itself: the breaks are display only.
export const PAGE_HEIGHT = 1056;
export const MARGIN = 96;
export const GAP = 24;
const CONTENT = PAGE_HEIGHT - 2 * MARGIN; // 864
const BREAK_EXTRA = MARGIN + GAP + MARGIN; // what a break adds besides the unused rest of the page
const PITCH = CONTENT + BREAK_EXTRA; // distance between the same point on two pages

type Break = { pos: number; height: number; page: number };
type Unit = { top: number; bottom: number; kind: "line" | "block"; el: HTMLElement; first: boolean; mid: number; left: number; pageBreak?: boolean };

const key = new PluginKey<{ set: DecorationSet; id: string }>("manuscriptPagination");

function breakElement(height: number) {
  const el = document.createElement("div");
  el.className = "pg-break";
  el.contentEditable = "false";
  el.style.height = `${height}px`;
  const rest = height - BREAK_EXTRA;
  el.innerHTML = `<span class="pg-gap" style="top:${rest + MARGIN}px"></span>`;
  return el;
}

// Where every unit of content sits now (lines of paragraphs and headings, whole blocks for everything else), measured
// as if no page break had been drawn: the heights of the breaks already on screen are taken back out.
function measure(view: EditorView): Unit[] {
  const root = view.dom as HTMLElement;
  const rootBox = root.getBoundingClientRect();
  const rootTop = rootBox.top + root.clientTop;
  // The page can be zoomed on screen (ZoomBox): measure in the page's own pixels.
  const scale = root.offsetWidth > 0 && rootBox.width > 0 ? rootBox.width / root.offsetWidth : 1;
  const spacers = [...root.querySelectorAll<HTMLElement>(".pg-break")].map((el) => {
    const r = el.getBoundingClientRect();
    return { top: (r.top - rootTop) / scale, height: r.height / scale };
  });
  const shiftAt = (y: number) => spacers.reduce((sum, s) => (s.top + s.height <= y + 0.5 ? sum + s.height : sum), 0);
  const natural = (clientY: number) => {
    const y = (clientY - rootTop) / scale;

    return y - shiftAt(y);
  };

  const units: Unit[] = [];

  for (const el of Array.from(root.children) as HTMLElement[]) {
    if (el.classList.contains("pg-break")) continue;

    const rect = el.getBoundingClientRect();
    const textual = /^(P|H1|H2|H3)$/.test(el.tagName);
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const fragments: { mid: number; left: number }[] = [];

    if (textual) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => (node.parentElement?.closest(".pg-break") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of Array.from(range.getClientRects())) {
          if (r.height > 0) fragments.push({ mid: (r.top + r.bottom) / 2, left: r.left });
        }
      }
    }

    if (fragments.length === 0) {
      units.push({
        top: natural(rect.top),
        bottom: natural(rect.bottom),
        kind: "block",
        el,
        first: true,
        mid: rect.top,
        left: rect.left,
        pageBreak: el.hasAttribute("data-page-break"),
      });
      continue;
    }

    fragments.sort((a, b) => a.mid - b.mid || a.left - b.left);
    const lines: { mid: number; left: number }[] = [];
    for (const f of fragments) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.mid - f.mid) < 3) last.left = Math.min(last.left, f.left);
      else lines.push({ ...f });
    }

    lines.forEach((line, index) => {
      // Both edges come from the one centre: measured separately, a line that starts a hair after a page gap could have
      // its top counted before the gap and its bottom after it (it then looked a whole gap taller than it is).
      const centre = natural(line.mid);
      units.push({
        top: centre - lineHeight / 2,
        bottom: centre + lineHeight / 2,
        kind: "line",
        el,
        first: index === 0,
        mid: line.mid,
        left: line.left,
      });
    });
  }

  return units;
}

function layout(view: EditorView): { breaks: Break[]; pages: number } {
  const root = view.dom as HTMLElement;
  const units = measure(view);
  const children = Array.from(root.childNodes);
  const breaks: Break[] = [];

  let shift = 0;
  let pageEnd = MARGIN + CONTENT;
  let page = 1;
  let force = false;

  for (const unit of units) {
    if (unit.pageBreak) {
      // An explicit page break only forces what follows onto the next page.
      force = true;
      continue;
    }

    let top = unit.top + shift;
    let bottom = unit.bottom + shift;
    const atPageTop = top <= pageEnd - CONTENT + 1;

    if ((force || bottom > pageEnd + 1) && !atPageTop) {
      let pos: number | null = null;

      try {
        if (unit.kind === "line" && !unit.first) {
          pos = view.posAtCoords({ left: unit.left + 1, top: unit.mid })?.pos ?? null;
        } else {
          pos = view.posAtDOM(root, children.indexOf(unit.el));
        }
      } catch {
        pos = null;
      }

      if (pos !== null) {
        const height = Math.max(0, pageEnd - top) + BREAK_EXTRA;
        breaks.push({ pos, height: Math.round(height), page });
        shift += height;
        pageEnd += PITCH;
        page += 1;
        top += height;
        bottom += height;
      }
    }

    force = false;
    // Something taller than a page runs over the following ones.
    while (bottom > pageEnd + 1) {
      pageEnd += PITCH;
      page += 1;
    }
  }

  return { breaks, pages: page };
}

export type PaginationOptions = { onPages?: (pages: number) => void };

export const Pagination = Extension.create<PaginationOptions>({
  name: "pagination",
  addOptions: () => ({ onPages: undefined }),
  addProseMirrorPlugins() {
    const onPages = this.options.onPages;

    return [
      new Plugin({
        key,
        state: {
          init: () => ({ set: DecorationSet.empty, id: "" }),
          apply(tr, value) {
            const meta = tr.getMeta(key) as { breaks: Break[]; pages: number; id: string } | undefined;

            if (meta) {
              const widgets = meta.breaks.map((b) =>
                Decoration.widget(b.pos, () => breakElement(b.height), { side: -1, key: `pg-${b.pos}-${b.height}`, stopEvent: () => true }),
              );

              return { set: DecorationSet.create(tr.doc, widgets), id: meta.id };
            }

            return tr.docChanged ? { set: value.set.map(tr.mapping, tr.doc), id: value.id } : value;
          },
        },
        props: {
          decorations(state) {
            return key.getState(state)?.set;
          },
        },
        view(view) {
          let timer: ReturnType<typeof setTimeout> | null = null;
          let reported = 0;
          let destroyed = false;

          const run = () => {
            timer = null;
            const root = view.dom as HTMLElement;
            if (destroyed || !root.isConnected || root.clientWidth === 0) return;

            const { breaks, pages } = layout(view);
            const id = JSON.stringify(breaks.map((b) => [b.pos, b.height])) + pages;

            root.style.minHeight = `${pages * PAGE_HEIGHT + (pages - 1) * GAP}px`;
            if (pages !== reported) {
              reported = pages;
              onPages?.(pages);
            }

            if (id !== key.getState(view.state)?.id) {
              view.dispatch(view.state.tr.setMeta(key, { breaks, pages, id }).setMeta("addToHistory", false));
            }
          };

          const schedule = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => requestAnimationFrame(run), 120);
          };

          const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
          resize?.observe(view.dom);
          view.dom.addEventListener("load", schedule, true);
          void document.fonts?.ready.then(schedule);
          schedule();

          return {
            update: (updated, previous) => {
              if (!updated.state.doc.eq(previous.doc)) schedule();
            },
            destroy: () => {
              destroyed = true;
              if (timer) clearTimeout(timer);
              resize?.disconnect();
              view.dom.removeEventListener("load", schedule, true);
            },
          };
        },
      }),
    ];
  },
});
