"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { auth, db, type CapstoneGroup } from "../_lib/firebase";
import { getAdviserCreatedGroups, subscribeToGroupAssignments } from "../_utils/groupAssignmentStorage";
import { getStoredStudentGroup, subscribeToStudentGroupStorage } from "../student/_utils/studentGroupStorage";
import { emptyDefenseWorkspace, safeDefenseLink, validateDefenseSchedule, type DefenseScheduleEntry } from "../_utils/defenseWorkspace";

const inputClass = "w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:border-[#4f8f58] focus:ring-2 focus:ring-[#edf9e9]";
const buttonClass = "rounded-xl border border-[#dfe8df] bg-white px-4 py-2.5 text-sm font-medium text-[#203028] hover:bg-[#f3f7f1] disabled:opacity-40";
const primaryClass = "inline-flex items-center gap-2 rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1b573d] disabled:opacity-40";
const workspaceTabs = [["schedule", "Schedule"], ["reminders", "Reminders & preparation"], ["files", "Files & presentation"], ["redefense", "Re-defense"]] as const;
type WorkspaceTab = (typeof workspaceTabs)[number][0];
type Account = { role: string; fullName: string; course?: string };

export default function DefenseWorkspace({ adviser = false, courseCode }: { adviser?: boolean; courseCode?: string }) {
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<Account | null>(null);
  const [studentCourse, setStudentCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => onAuthStateChanged(auth, (user) => {
    setUid(user?.uid || ""); setProfile(null); setStudentCourse(""); setLoading(Boolean(user)); setError("");
  }), []);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() as Account : null); setLoading(false); setError("");
    }, () => { setError("Unable to load your account. Check your connection and try again."); setLoading(false); });
  }, [uid]);
  useEffect(() => {
    if (adviser || !uid) return;
    function syncCourse() {
      const group = getStoredStudentGroup();
      const belongs = group && (group.leaderId === uid || group.members.some((member) => member.uid === uid || member.email.toLowerCase() === auth.currentUser?.email?.toLowerCase()));
      setStudentCourse(profile?.course || (belongs ? group.course : ""));
    }
    queueMicrotask(syncCourse);
    return subscribeToStudentGroupStorage(syncCourse);
  }, [adviser, uid, profile]);
  const course = adviser ? courseCode : studentCourse;
  const permitted = profile?.role === (adviser ? "Adviser" : "Student");
  if (uid && permitted && course) return <CourseSchedule key={`${uid}-${course}-${adviser}`} course={course} uid={uid} adviser={adviser} adviserName={profile?.fullName || "Adviser"} />;
  return <div className="rounded-2xl border border-[#dfe8df] bg-white p-6 text-sm text-[#59645d]">{error || (loading ? "Loading your course..." : !uid ? "Sign in to view defense schedules." : !permitted ? "Your account does not have access to this page." : adviser ? "Open a course folder to manage defense schedules." : "Confirm your course assignment in student setup to view defense schedules.")}</div>;
}

function CourseSchedule({ course, uid, adviser, adviserName }: { course: string; uid: string; adviser: boolean; adviserName: string }) {
  const [entries, setEntries] = useState<DefenseScheduleEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [localGroups, setLocalGroups] = useState<CapstoneGroup[]>([]);
  const [remoteGroups, setRemoteGroups] = useState<CapstoneGroup[]>([]);
  const [groupError, setGroupError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<WorkspaceTab>("schedule");
  const [editor, setEditor] = useState<{ entry: DefenseScheduleEntry; editable: boolean } | null>(null);
  useEffect(() => onSnapshot(query(collection(db, "courseDefenseWorkspaces"), where("course", "==", course)), (snapshot) => {
    setEntries(snapshot.docs.map((item) => ({ ...emptyDefenseWorkspace(), groupId: "", groupName: "Course announcement", section: "", projectTitle: "", members: "", endTime: "", ...item.data(), id: item.id } as DefenseScheduleEntry)));
    setLoaded(true); setError("");
  }, () => { setError("Unable to load defense schedules. Check your connection and course access."); setLoaded(false); }), [course]);
  useEffect(() => {
    if (!adviser) return;
    const sync = () => setLocalGroups(getAdviserCreatedGroups());
    queueMicrotask(sync);
    return subscribeToGroupAssignments(sync);
  }, [adviser]);
  useEffect(() => {
    if (!adviser) return;
    return onSnapshot(query(collection(db, "groups"), where("adviserId", "==", uid)), (snapshot) => {
      setRemoteGroups(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as CapstoneGroup)); setGroupError("");
    }, () => setGroupError("Online group assignments could not load. Saved assignments on this device are available."));
  }, [adviser, uid]);
  const groups = [...new Map([...localGroups, ...remoteGroups].filter((group) => group.course === course && group.adviserId === uid).map((group) => [group.id, group])).values()];
  const filtered = entries.filter((entry) => (status === "All" || entry.status === status) && [entry.groupName, entry.section, entry.projectTitle, entry.stage, entry.adviserName, entry.venue].join(" ").toLowerCase().includes(search.toLowerCase())).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.groupName.localeCompare(b.groupName));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function addSchedule() { setTab("schedule"); setEditor({ editable: true, entry: { ...emptyDefenseWorkspace(), id: "", course, groupId: "", groupName: "", section: "", projectTitle: "", members: "", adviserId: uid, adviserName, endTime: "", status: "Scheduled" } }); }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f8f58]">{course} / Defense</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#203028]">Defense schedules</h2><p className="mt-1 text-sm text-[#7b877f]">{adviser ? "Schedule groups and keep your course informed." : "View your course defense schedules, instructions, and presentation links."}</p></div>{adviser && <button type="button" disabled={!loaded} onClick={addSchedule} className={primaryClass}><span aria-hidden="true" className="text-xl leading-none">+</span> Schedule group</button>}</div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
    <div role="tablist" aria-label="Defense workspace sections" className="flex flex-wrap gap-2">{workspaceTabs.map(([id, label], index) => <button key={id} id={`workspace-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="workspace-panel" tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={(event) => {
      const next = event.key === "ArrowRight" ? (index + 1) % workspaceTabs.length : event.key === "ArrowLeft" ? (index + workspaceTabs.length - 1) % workspaceTabs.length : event.key === "Home" ? 0 : event.key === "End" ? workspaceTabs.length - 1 : null;
      if (next === null) return; event.preventDefault(); setTab(workspaceTabs[next][0]); (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
    }} className={`${buttonClass} ${tab === id ? "!border-[#123f2b] !bg-[#123f2b] !text-white" : ""}`}>{label}</button>)}</div>
    <div id="workspace-panel" role="tabpanel" aria-labelledby={`workspace-tab-${tab}`}>
    <section aria-label="Course defense schedules" className="overflow-hidden rounded-2xl border border-[#e2e9e2] bg-white shadow-[0_8px_32px_rgba(31,42,36,0.04)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#edf2ec] p-4"><input aria-label="Search defense schedules" placeholder="Search groups, projects, or venues..." className={`${inputClass} max-w-sm`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter by schedule status" className={`${inputClass} sm:w-auto`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{["All", "Pending", "Scheduled", "Completed", "Cancelled"].map((item) => <option key={item} value={item}>{item === "All" ? "All statuses" : item}</option>)}</select><label className="ml-auto flex items-center gap-2 text-xs text-[#7b877f]">Showing<select className="rounded-lg border border-[#dfe8df] bg-[#f8faf7] px-2 py-2 text-[#203028]" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map((count) => <option key={count}>{count}</option>)}</select></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><caption className="sr-only">{course} defense schedule. Times are in Philippine time.</caption><thead className="bg-[#fafcf9] text-xs text-[#7b877f]"><tr>{["Group / Project", "Section", "Defense stage", tab === "schedule" ? "Date & time" : tab === "reminders" ? "Deadline" : tab === "files" ? "Shared links" : "Re-defense date", tab === "schedule" ? "Venue" : tab === "reminders" ? "Reminders" : tab === "files" ? "Instructions" : "Required revisions", "Status", "Action"].map((heading) => <th key={heading} scope="col" className="px-5 py-4 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#edf2ec]">
        {visible.map((entry) => <tr key={entry.id} className="hover:bg-[#fbfdfb]"><td className="max-w-[280px] px-5 py-4"><p className="font-semibold text-[#203028]">{entry.groupName}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7b877f]">{entry.projectTitle || entry.adviserName}</p></td><td className="px-5 py-4 text-[#59645d]">{entry.section || "All sections"}</td><td className="px-5 py-4 text-[#59645d]">{entry.stage}</td><td className="whitespace-nowrap px-5 py-4"><p className="font-medium text-[#203028]">{tab === "files" ? [entry.manuscriptUrl && "Manuscript", entry.presentationUrl && "Presentation", entry.demoUrl && "Demo"].filter(Boolean).join(", ") || "No links yet" : formatDate(tab === "reminders" ? entry.deadline : tab === "redefense" ? entry.redefenseDate : entry.date)}</p>{(tab === "schedule" || tab === "redefense") && <p className="mt-1 text-xs text-[#7b877f]">{tab === "redefense" ? entry.redefenseRequired ? `${formatTime(entry.redefenseTime)} PHT` : "Not required" : `${formatTime(entry.time)}${entry.endTime ? ` - ${formatTime(entry.endTime)}` : ""} PHT`}</p>}</td><td className="max-w-[180px] break-words px-5 py-4 text-[#59645d]">{(tab === "reminders" ? entry.reminders : tab === "files" ? entry.fileInstructions : tab === "redefense" ? entry.redefenseReason : entry.venue) || "Not provided"}</td><td className="px-5 py-4"><Status value={entry.status} /></td><td className="px-5 py-4"><button type="button" onClick={() => setEditor({ entry, editable: adviser && entry.adviserId === uid })} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#4f8f58] hover:bg-[#edf9e9]" aria-label={`${adviser && entry.adviserId === uid ? "Edit" : "View"} ${entry.groupName} defense`}>{adviser && entry.adviserId === uid ? "Edit details" : "View details"}</button></td></tr>)}
        {!visible.length && <tr><td colSpan={7} className="px-5 py-16 text-center"><p className="font-medium text-[#203028]">{!loaded ? "Loading defense schedules..." : entries.length ? "No matching schedules" : "No groups scheduled yet"}</p><p className="mt-2 text-sm text-[#7b877f]">{entries.length ? "Try a different search or status." : adviser ? "Use + Schedule group to publish the first defense." : "Schedules will appear here when your adviser publishes them."}</p></td></tr>}
      </tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ec] px-5 py-4 text-xs text-[#7b877f]"><p>{filtered.length} schedules / Philippine time (PHT)</p><div className="flex items-center gap-3"><button type="button" className={buttonClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>{currentPage} / {pageCount}</span><button type="button" className={buttonClass} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
    </section>
    </div>
    {editor && <ScheduleDialog key={editor.entry.id || "new"} tab={tab} entry={editor.entry} editable={editor.editable} groups={groups} groupError={groupError} uid={uid} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice(`Updates published. Students in ${course} can view them in Defense.`); }} />}
  </div>;
}

function ScheduleDialog({ tab, entry, editable, groups, groupError, uid, onClose, onSaved }: { tab: WorkspaceTab; entry: DefenseScheduleEntry; editable: boolean; groups: CapstoneGroup[]; groupError: string; uid: string; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const publicationId = useRef(entry.id || doc(collection(db, "courseDefenseWorkspaces")).id);
  const [draft, setDraft] = useState(entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  function update<K extends keyof DefenseScheduleEntry>(key: K, value: DefenseScheduleEntry[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  function selectGroup(id: string) {
    const group = groups.find((item) => item.id === id);
    if (group) setDraft((current) => ({ ...current, groupId: group.id, groupName: group.groupName, section: group.section, projectTitle: group.projectTitle, members: group.members.map((member) => member.name).join(", "), panelists: group.panelists.join(", "), stage: group.stage.includes("Defense") ? group.stage : current.stage }));
    else setDraft((current) => ({ ...current, groupId: "", groupName: "", section: "", projectTitle: "", members: "" }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || auth.currentUser?.uid !== uid || draft.adviserId !== uid) return;
    const validation = validateDefenseSchedule(draft);
    if (validation) { setError(validation); return; }
    if ((!entry.id || !entry.groupId) && !groups.some((group) => group.id === draft.groupId && group.course === draft.course && group.adviserId === uid)) { setError("Choose one of your assigned groups in this course."); return; }
    setSaving(true); setError("");
    try {
      const account = await getDoc(doc(db, "users", uid));
      if (account.data()?.role !== "Adviser" || auth.currentUser?.uid !== uid) throw new Error("Access denied");
      const reference = doc(db, "courseDefenseWorkspaces", publicationId.current);
      if (entry.id) {
        const existing = await getDoc(reference);
        if (!existing.exists() || existing.data().adviserId !== uid || existing.data().course !== draft.course) throw new Error("Access denied");
      }
      const payload = { ...draft, updatedAt: new Date().toISOString(), updatedBy: uid };
      await setDoc(reference, { ...payload, id: reference.id });
      onSaved();
    } catch { setError("Schedule was not saved. Your inputs are still here. Check your connection and publishing permissions, then retry."); }
    finally { setSaving(false); }
  }
  function field(key: keyof DefenseScheduleEntry, label: string, type = "text", multiline = false, required = false) {
    const value = String(draft[key]);
    return <Field label={label}>{editable ? multiline ? <textarea rows={3} className={inputClass} value={value} onChange={(event) => update(key, event.target.value)} /> : <input required={required} type={type} className={inputClass} value={value} onChange={(event) => update(key, event.target.value)} /> : <p className="whitespace-pre-wrap break-words rounded-xl bg-[#f8faf7] p-3 text-sm text-[#203028]">{type === "date" && value ? formatDate(value) : type === "time" && value ? `${formatTime(value)} PHT` : value || "Not provided"}</p>}</Field>;
  }
  function link(key: "manuscriptUrl" | "presentationUrl" | "demoUrl", label: string) {
    const url = safeDefenseLink(draft[key]);
    return editable ? field(key, label, "url") : <Field label={label}>{url ? <a className="inline-block rounded-xl bg-[#edf9e9] px-4 py-3 text-sm font-medium text-[#245329]" href={url} target="_blank" rel="noopener noreferrer">Open {label.toLowerCase()}</a> : <p className="text-sm text-[#7b877f]">No link provided</p>}</Field>;
  }
  return <dialog ref={dialog} aria-labelledby="schedule-dialog-title" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[760px] overflow-y-auto rounded-2xl border border-[#dfe8df] bg-white p-0 shadow-2xl backdrop:bg-[#14251c]/40">
    <form onSubmit={save}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#edf2ec] bg-white px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#4f8f58]">{draft.course} defense</p><h3 id="schedule-dialog-title" className="mt-1 text-xl font-semibold text-[#203028]">{editable ? entry.id ? `Edit ${workspaceTabs.find(([id]) => id === tab)?.[1].toLowerCase()}` : "Schedule a group" : workspaceTabs.find(([id]) => id === tab)?.[1]}</h3><p className="mt-1 text-sm text-[#7b877f]">{editable ? "Published details are visible to all students in this course." : "Published by your adviser. View only."}</p></div><button type="button" disabled={saving} className={buttonClass} onClick={onClose} aria-label="Close defense details">Close</button></div>
      <fieldset disabled={saving} className="min-w-0 space-y-7 p-6">
        {tab === "schedule" && <><section><SectionTitle title="Group & project" /><div className="mt-4 grid gap-4 sm:grid-cols-2">
          {editable && (!entry.id || !entry.groupId) ? <div className="sm:col-span-2"><Field label="Assigned group *"><select required className={inputClass} value={draft.groupId} onChange={(event) => selectGroup(event.target.value)}><option value="">Select a group in {draft.course}</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.groupName} / {group.section}</option>)}</select></Field>{groupError && <p className="mt-2 text-xs text-amber-700">{groupError}</p>}{!groups.length && <p className="mt-2 text-sm text-[#7b877f]">No assigned groups in this course. <Link href="/adviser/assigned-groups" className="font-medium text-[#4f8f58] underline">Manage assigned groups</Link></p>}</div> : <Field label="Group"><p className="rounded-xl bg-[#f8faf7] p-3 text-sm font-semibold text-[#203028]">{draft.groupName}</p></Field>}
          <Field label="Section"><p className="rounded-xl bg-[#f8faf7] p-3 text-sm text-[#203028]">{draft.section || "Select a group"}</p></Field><Field label="Adviser"><p className="rounded-xl bg-[#f8faf7] p-3 text-sm text-[#203028]">{draft.adviserName}</p></Field><div className="sm:col-span-2"><Field label="Project title"><p className="rounded-xl bg-[#f8faf7] p-3 text-sm text-[#203028]">{draft.projectTitle || "Project title pending"}</p></Field></div><div className="sm:col-span-2"><Field label="Group members"><p className="rounded-xl bg-[#f8faf7] p-3 text-sm text-[#203028]">{draft.members || "Not provided"}</p></Field></div>
        </div></section>
        <section><SectionTitle title="Defense schedule" subtitle="All dates and times use Philippine time (PHT)." /><div className="mt-4 grid gap-4 sm:grid-cols-2">{field("stage", "Defense stage *", "text", false, true)}{editable ? <Field label="Status"><select className={inputClass} value={draft.status} onChange={(event) => update("status", event.target.value as DefenseScheduleEntry["status"])}>{["Pending", "Scheduled", "Completed", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</select></Field> : <Field label="Status"><Status value={draft.status} /></Field>}{field("date", "Defense date *", "date", false, true)}{field("time", "Start time *", "time", false, true)}{field("endTime", "End time", "time")}{field("venue", "Venue or meeting link *", "text", false, true)}<div className="sm:col-span-2">{field("panelists", "Panelists", "text", true)}</div><div className="sm:col-span-2">{field("scheduleNotes", "Schedule notes", "text", true)}</div></div></section></>}
        {tab === "reminders" && <section><SectionTitle title="Reminders & preparation" /><div className="mt-4 space-y-4">{field("deadline", "Preparation deadline", "date")}{field("reminders", "Reminders and requirements", "text", true)}</div></section>}
        {tab === "files" && <section><SectionTitle title="Files & presentation" /><div className="mt-4 grid gap-4 sm:grid-cols-2">{link("manuscriptUrl", "Manuscript link")}{link("presentationUrl", "Presentation link")}{link("demoUrl", "System demo link")}<div className="sm:col-span-2">{field("fileInstructions", "Submission and presentation instructions", "text", true)}</div></div></section>}
        {tab === "redefense" && <section><SectionTitle title="Re-defense" /><div className="mt-4 space-y-4">{editable ? <label className="flex items-center gap-3 rounded-xl bg-[#f8faf7] p-4 text-sm text-[#203028]"><input type="checkbox" checked={draft.redefenseRequired} onChange={(event) => update("redefenseRequired", event.target.checked)} />This group requires re-defense</label> : <p className="text-sm text-[#59645d]">{draft.redefenseRequired ? "Re-defense required for this group." : "No re-defense required."}</p>}{draft.redefenseRequired && <div className="grid gap-4 sm:grid-cols-2">{field("redefenseDate", "Re-defense date *", "date", false, true)}{field("redefenseTime", "Re-defense time *", "time", false, true)}{field("redefenseVenue", "Re-defense venue *", "text", false, true)}<div className="sm:col-span-2">{field("redefenseReason", "Reason and required revisions *", "text", true)}</div></div>}</div></section>}
      </fieldset>
      {error && <p role="alert" className="mx-6 mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ec] bg-white px-6 py-4"><p className="text-xs text-[#7b877f]">{draft.updatedAt ? `Updated ${new Date(draft.updatedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}` : "* Required fields"}</p><div className="flex gap-2"><button type="button" disabled={saving} className={buttonClass} onClick={onClose}>{editable ? "Cancel" : "Close"}</button>{editable && <button type="submit" disabled={saving || (tab === "schedule" && !draft.groupId)} className={primaryClass}>{saving ? "Publishing..." : "Save & publish"}</button>}</div></div>
    </form>
  </dialog>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-2"><span className="block text-xs font-semibold text-[#59645d]">{label}</span>{children}</label>; }
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) { return <div><h4 className="text-sm font-semibold text-[#203028]">{title}</h4>{subtitle && <p className="mt-1 text-xs text-[#7b877f]">{subtitle}</p>}</div>; }
function Status({ value }: { value: string }) { const color = value === "Scheduled" ? "bg-emerald-50 text-emerald-700" : value === "Completed" ? "bg-blue-50 text-blue-700" : value === "Cancelled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${color}`}>{value}</span>; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00+08:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "To be announced"; }
function formatTime(value: string) { if (!value) return "Time pending"; const [hour, minute] = value.split(":").map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`; }
