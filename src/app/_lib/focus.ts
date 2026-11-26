// A notice opens the exact thing it is about, not just the page: the backend adds it to the link (`Notifier::send(..., focus: ['requirement' => 5, 'group' => 2])`
// gives /adviser/requirements?requirement=5&group=2). The page reads it here, opens that row and scrolls to it.

export type Focus = { requirement?: number; group?: number; defense?: number };

function whole(value: string | null) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : undefined;
}

// What the address names. Call it inside an effect or an event (it needs the browser's address).
export function readFocus(): Focus {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);

  return { requirement: whole(params.get("requirement")), group: whole(params.get("group")), defense: whole(params.get("defense")) };
}

// Waits (a short while) for the element to be drawn, scrolls it to the middle and marks it for a moment so the eye finds it.
export function scrollToFocus(elementId: string) {
  let tries = 0;

  const attempt = () => {
    const element = document.getElementById(elementId);

    if (!element) {
      if (tries++ < 25) window.setTimeout(attempt, 120);

      return;
    }

    element.scrollIntoView({ block: "center", behavior: "smooth" });
    element.classList.add("ring-2", "ring-[#4ac214]", "ring-offset-2", "transition");
    window.setTimeout(() => element.classList.remove("ring-2", "ring-[#4ac214]", "ring-offset-2"), 2600);
  };

  window.setTimeout(attempt, 150);
}

export const focusId = {
  requirement: (id: number) => `focus-requirement-${id}`,
  group: (id: number) => `focus-group-${id}`,
  defense: (id: number) => `focus-defense-${id}`,
};
