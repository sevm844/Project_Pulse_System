import Image from "next/image";

type SidebarToggleProps = {
  collapsed: boolean;
  onClick: () => void;
};

export default function SidebarToggle({
  collapsed,
  onClick,
}: SidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="absolute -right-3 top-8 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_6px_14px_rgba(31,42,36,0.14)] ring-1 ring-[#dfe8df] transition hover:scale-105"
    >
      <Image
        src={
          collapsed ? "/sidebar-toggle-open.png" : "/sidebar-toggle-close.png"
        }
        alt=""
        width={24}
        height={24}
        className="rounded-full"
      />
    </button>
  );
}
