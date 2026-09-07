import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab/Shift+Tab cycling inside the returned container while it's
 * mounted, and restores focus to whatever was focused before it mounted
 * once it unmounts (e.g. the button that opened a modal). */
export function useFocusTrap<T extends HTMLElement>() {
	const containerRef = useRef<T>(null);

	useEffect(() => {
		const previouslyFocused = document.activeElement as HTMLElement | null;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab" || !containerRef.current) return;
			const focusable = Array.from(
				containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			);
			if (focusable.length === 0) return;
			const first = focusable[0] as HTMLElement;
			const last = focusable[focusable.length - 1] as HTMLElement;
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			previouslyFocused?.focus();
		};
	}, []);

	return containerRef;
}
