import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ContentPiece } from "@/components/ContentPiece";
import { CreatePieceForm, type NewPiece } from "@/components/CreatePieceForm";
import { ExploreButton } from "@/components/ExploreButton";
import { RevealDots } from "@/components/RevealDots";
import { categories, type Piece, pieces } from "@/data/pieces";
import { createPiece } from "@/server/pieces";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Random — una pieza de contenido curado a la vez" },
			{
				name: "description",
				content:
					"Un hecho, un lugar, una idea. Random revela una sola pieza de contenido curado por vez, con la calma de una revista impresa.",
			},
			{ property: "og:title", content: "Random — una pieza a la vez" },
			{
				property: "og:description",
				content:
					"Un hecho, un lugar, una idea. Descubre algo valioso, revelado con cuidado.",
			},
		],
	}),
	component: RandomPage,
});

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = copy[i] as T;
		copy[i] = copy[j] as T;
		copy[j] = a;
	}
	return copy;
}

const EXIT_MS = 300;
const GAP_MS = 120;

function RandomPage() {
	const [queue, setQueue] = useState<Piece[]>(() => pieces);
	const [index, setIndex] = useState(0);
	const [phase, setPhase] = useState<"entering" | "exiting" | "waiting">(
		"entering",
	);
	const [formOpen, setFormOpen] = useState(false);
	const timers = useRef<number[]>([]);

	// Randomize order after hydration so SSR and client markup agree.
	useEffect(() => {
		setQueue(shuffle(pieces));
		setIndex(0);
	}, []);

	const addPiece = useCallback(
		(input: NewPiece) => {
			const piece: Piece = {
				id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				label: categories[input.category].label,
				...input,
			};
			setQueue((q) => {
				const next = [...q];
				next.splice(index + 1, 0, piece);
				return next;
			});
			setFormOpen(false);
			createPiece({ data: input }).catch(() => {});
		},
		[index],
	);

	useEffect(
		() => () => {
			timers.current.forEach(window.clearTimeout);
		},
		[],
	);

	const current = (queue[index] ?? pieces[0]) as Piece;
	const accent = categories[current.category].accent;

	const next = useCallback(() => {
		setPhase("exiting");
		timers.current.push(
			window.setTimeout(() => setPhase("waiting"), EXIT_MS),
			window.setTimeout(() => {
				setIndex((i) => {
					if (i + 1 < queue.length) return i + 1;
					setQueue((q) => shuffle(q));
					return 0;
				});
				setPhase("entering");
			}, EXIT_MS + GAP_MS),
		);
	}, [queue.length]);

	const style = useMemo(() => ({ ["--accent" as string]: accent }), [accent]);

	return (
		<main
			style={style}
			className="relative flex min-h-screen flex-col bg-paper px-6 sm:px-10"
		>
			<p className="pt-10 text-[10px] uppercase tracking-[0.34em] text-ink-soft">
				Random
			</p>

			<div className="flex flex-1 items-center justify-center py-20 sm:py-28">
				<div className="w-full max-w-160">
					<div className="min-h-76 sm:min-h-84">
						{phase === "waiting" ? (
							<div className="pt-2">
								<RevealDots />
							</div>
						) : (
							<ContentPiece
								key={current.id}
								piece={current}
								phase={phase === "exiting" ? "exiting" : "entering"}
							/>
						)}
					</div>

					<div className="mt-14 flex items-center justify-between">
						<ExploreButton onExplore={next} disabled={phase !== "entering"} />
						<button
							type="button"
							onClick={() => setFormOpen(true)}
							className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60"
						>
							Crear curiosidad
						</button>
					</div>
				</div>
			</div>

			{formOpen ? (
				<CreatePieceForm
					onSubmit={addPiece}
					onClose={() => setFormOpen(false)}
				/>
			) : null}
		</main>
	);
}
