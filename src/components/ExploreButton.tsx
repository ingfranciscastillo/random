import { useState } from "react";

export function ExploreButton({
	onExplore,
	disabled,
}: {
	onExplore: () => void;
	disabled?: boolean;
}) {
	const [tapped, setTapped] = useState(false);

	const handleClick = () => {
		if (disabled) return;
		setTapped(true);
		window.setTimeout(() => setTapped(false), 100);
		window.setTimeout(onExplore, 100);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			className="group relative inline-flex items-center gap-2 rounded-xs px-1 py-1 text-[11px] uppercase tracking-[0.24em] text-ink outline-none transition-opacity focus-visible:opacity-60 disabled:cursor-default"
			style={{
				animation: tapped ? "press-tap 100ms linear" : undefined,
				transform: tapped ? "scale(0.97)" : "scale(1)",
			}}
		>
			<span className="relative">
				Explore
				<span
					className="accent-shift absolute -bottom-0.75 left-0 block h-px w-full origin-left scale-x-0 transition-transform duration-250 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
					style={{ backgroundColor: "var(--accent)" }}
				/>
			</span>
			<span
				aria-hidden
				className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
			>
				→
			</span>
		</button>
	);
}
