// Clean one-colour line icons for the sidebar (they take the text colour, so they follow active / hover automatically).
const PATHS: Record<string, React.ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7.5" height="9" rx="2" /><rect x="13.5" y="3" width="7.5" height="5.5" rx="2" /><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2" /><rect x="3" y="15" width="7.5" height="6" rx="2" /></>),
  projects: (<><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" /></>),
  defense: (<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 21h8M12 16v5" /></>),
  requirements: (<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8.5l1.5 1.5L13.5 7M9 15h6" /></>),
  documents: (<><path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>),
  manuscript: (<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M9 8h7" /></>),
  "review-queue": (<><path d="M4 6h12M4 12h8M4 18h6" /><circle cx="17" cy="16" r="3" /><path d="M19.2 18.2L21.5 20.5" /></>),
  certificates: (<><circle cx="12" cy="9" r="5.5" /><path d="M8.7 13.5L7.5 21l4.5-2.5 4.5 2.5-1.2-7.5M10 9l1.5 1.5L14.5 7.5" /></>),
  administration: (<><path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>),
  reports: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  feedback: (<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 14.5z" /><path d="M8.5 8.5h7M8.5 12h4" /></>),
  "collection-tracker": (<><rect x="3" y="4" width="18" height="17" rx="2.5" /><path d="M3 9.5h18M8 2.5v3M16 2.5v3M8 14l2 2 3.5-3.5" /></>),
  "archive-records": (<><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v9.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9M10 13h4" /></>),
  messages: (<><path d="M21 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.5A8 8 0 1 1 21 12z" /></>),
  notifications: (<><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></>),
  profile: (<><circle cx="12" cy="8" r="4" /><path d="M4 20.5c.8-3.8 4-6 8-6s7.2 2.2 8 6" /></>),
};

export function hasNavIcon(src: string) {
  return Boolean(PATHS[iconName(src)]);
}

function iconName(src: string) {
  return src.replace(/^.*\//, "").replace(/\.png$/, "");
}

export default function NavIcon({ src, className = "h-5 w-5" }: { src: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[iconName(src)]}
    </svg>
  );
}
