/**
 * The mark: a thin ring (everything that could be shown) holding one solid
 * dot (the piece actually revealed). Reuses the same --accent custom
 * property the homepage already sets per content family, so the mark tints
 * itself to match whatever is on screen without any extra plumbing.
 */
export function Logo({
	size = 13,
	className,
}: {
	size?: number;
	className?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<circle
				cx="12"
				cy="12"
				r="9.5"
				stroke="currentColor"
				strokeWidth="1.25"
				opacity="0.35"
			/>
			<circle cx="12" cy="12" r="3.75" fill="var(--accent)" />
		</svg>
	);
}

export function Wordmark({
	suffix,
	className = "",
}: {
	suffix?: string;
	className?: string;
}) {
	return (
		<p
			className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.34em] text-ink-soft ${className}`}
		>
			<Logo />
			<span>{suffix ? `Random — ${suffix}` : "Random"}</span>
		</p>
	);
}
