import Image from "next/image";

type SidebarToggleProps = {
  collapsed: boolean;
  onClick: () => void;
  variant?: "default" | "panel";
};

export default function SidebarToggle({
  collapsed,
  onClick,
  variant = "default",
}: SidebarToggleProps) {
  const isPanelVariant = variant === "panel";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={
        isPanelVariant
          ? "absolute right-[-52px] top-7 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5ebe5] bg-white shadow-[0_8px_24px_rgba(31,42,36,0.08)] transition hover:bg-[#f8faf7]"
          : "absolute right-0 top-8 z-50 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full bg-white shadow-[0_6px_14px_rgba(31,42,36,0.14)] ring-1 ring-[#dfe8df] transition hover:scale-105"
      }
    >
      <Image
        src={
          isPanelVariant
            ? "/toggleicon.png"
            : collapsed
              ? "/sidebar-toggle-open.png"
              : "/sidebar-toggle-close.png"
        }
        alt=""
        width={isPanelVariant ? 17 : 24}
        height={isPanelVariant ? 17 : 24}
        className={isPanelVariant ? "opacity-75" : "rounded-full"}
      />
    </button>
  );
}
