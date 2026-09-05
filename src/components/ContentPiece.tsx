import { categories, type Piece, typeLabels } from "@/data/pieces";

type Phase = "entering" | "exiting";

function titleClasses(type: Piece["type"]) {
	if (type === "word") {
		return "font-display italic text-[2.6rem] leading-[1.15] font-light tracking-[-0.01em] sm:text-[3.4rem] md:text-[4rem]";
	}
	if (type === "record") {
		return "font-display text-[2.3rem] leading-[1.18] font-light tracking-[-0.015em] sm:text-[2.95rem] sm:leading-[1.14] md:text-[3.5rem] md:leading-[1.1]";
	}
	if (type === "question") {
		return "font-display italic text-[2.05rem] leading-[1.22] font-light tracking-[-0.01em] sm:text-[2.6rem] sm:leading-[1.18] md:text-[3.1rem] md:leading-[1.14]";
	}
	return "font-display text-[2.05rem] leading-[1.22] font-light tracking-[-0.01em] sm:text-[2.6rem] sm:leading-[1.18] md:text-[3.1rem] md:leading-[1.14]";
}

export function ContentPiece({ piece, phase }: { piece: Piece; phase: Phase }) {
	const cls = phase === "exiting" ? "reveal-exit" : "reveal-enter";
	const delay = (ms: number) => (phase === "exiting" ? "0ms" : `${ms}ms`);
	const family = categories[piece.category];

	return (
		<article>
			<div
				className={`${cls} flex flex-wrap items-center gap-x-4 gap-y-2`}
				style={{ animationDelay: delay(0) }}
			>
				<p className="text-[11px] uppercase tracking-[0.22em] text-ink">
					{typeLabels[piece.type]}
				</p>
				<span className="flex items-center gap-2">
					<span
						className="accent-shift block h-1.25 w-1.25 rounded-full"
						style={{ backgroundColor: "var(--accent)" }}
					/>
					<span className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">
						{family.label}
					</span>
				</span>
			</div>

			<h1
				className={`${cls} mt-7 text-ink ${titleClasses(piece.type)}`}
				style={{ animationDelay: delay(80) }}
			>
				{piece.title}
				{piece.type === "question" ? "?" : null}
			</h1>

			<div className={`${cls} mt-9`} style={{ animationDelay: delay(160) }}>
				<span
					className="accent-shift mb-5 block h-px w-10"
					style={{ backgroundColor: "var(--accent)" }}
				/>
				<p className="text-[13px] leading-relaxed tracking-[0.02em] text-ink-soft">
					{piece.context}
				</p>
				{piece.source ? (
					<a
						href={piece.source.url}
						target="_blank"
						rel="noreferrer"
						className="mt-4 inline-block text-[10px] uppercase tracking-[0.2em] text-ink-soft underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:decoration-current"
					>
						{piece.source.name}
					</a>
				) : null}
			</div>
		</article>
	);
}
