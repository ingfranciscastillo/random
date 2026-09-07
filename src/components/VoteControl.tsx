import { DislikeIcon } from "@solar-icons/react/bold/dislike";
import { LikeIcon } from "@solar-icons/react/bold/like";
import { DislikeIcon as DislikeIconOutline } from "@solar-icons/react/outline/dislike";
import { LikeIcon as LikeIconOutline } from "@solar-icons/react/outline/like";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { castVote, getVoteState, type VoteValue } from "@/server/votes";

const EXIT_MS = 200;

/** The losing button's collapse plays in three steps so the CSS transition
 * has a "shown" frame to animate away from, then unmounts for good so the
 * flex `gap` doesn't leave a permanent dead space where it used to be. */
type ExitPhase = "shown" | "shrinking" | null;

export function VoteControl({ pieceId }: { pieceId: string }) {
	const [myVote, setMyVote] = useState<VoteValue | 0>(0);
	const [pending, setPending] = useState(false);
	const [justVoted, setJustVoted] = useState(false);
	const [exitPhase, setExitPhase] = useState<ExitPhase>(null);
	const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const containerRef = useRef<HTMLDivElement>(null);
	const pendingFocusValue = useRef<VoteValue | null>(null);

	// Voting swaps the winning/losing buttons for a different set of DOM
	// nodes, so the clicked button is unmounted mid-interaction and focus
	// would otherwise fall back to <body>. Re-find the button that now
	// represents the same vote value and refocus it.
	useLayoutEffect(() => {
		if (pendingFocusValue.current === null) return;
		const target = containerRef.current?.querySelector<HTMLButtonElement>(
			`[data-vote-value="${pendingFocusValue.current}"]`,
		);
		target?.focus();
		pendingFocusValue.current = null;
	});

	useEffect(() => {
		let cancelled = false;
		setMyVote(0);
		setJustVoted(false);
		setExitPhase(null);
		getVoteState({ data: { pieceId } }).then((state) => {
			if (cancelled) return;
			setMyVote(state.myVote);
		});
		return () => {
			cancelled = true;
			clearTimeout(exitTimer.current);
		};
	}, [pieceId]);

	const vote = async (value: VoteValue) => {
		if (pending) return;
		setPending(true);
		pendingFocusValue.current = value;

		const prevVote = myVote;
		const next = prevVote === value ? 0 : value;

		clearTimeout(exitTimer.current);
		if (next !== 0) {
			setExitPhase("shown");
			requestAnimationFrame(() => {
				requestAnimationFrame(() => setExitPhase("shrinking"));
			});
			exitTimer.current = setTimeout(() => setExitPhase(null), EXIT_MS + 40);
		} else {
			setExitPhase(null);
		}
		setJustVoted(next !== 0);
		setMyVote(next);

		try {
			const state = await castVote({ data: { pieceId, value } });
			setMyVote(state.myVote);
		} catch {
			setMyVote(prevVote);
		} finally {
			setPending(false);
		}
	};

	const iconButtonCls = (active: boolean) =>
		`accent-shift inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-ink/5 disabled:opacity-30 ${
			active ? "text-accent" : ""
		}`;

	if (myVote !== 0) {
		const WinningIcon = myVote === 1 ? LikeIcon : DislikeIcon;
		const losingValue = myVote === 1 ? -1 : 1;
		const LosingIcon = losingValue === 1 ? LikeIconOutline : DislikeIconOutline;

		return (
			<div ref={containerRef} className="-ml-2 flex items-center gap-2.5">
				<button
					type="button"
					data-vote-value={myVote}
					aria-label={
						myVote === 1 ? "Quitar voto a favor" : "Quitar voto en contra"
					}
					disabled={pending}
					onClick={() => vote(myVote)}
					className={`accent-shift inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent disabled:opacity-50 ${
						justVoted ? "vote-pop" : ""
					}`}
				>
					<WinningIcon size={17} strokeWidth={1.5} />
				</button>

				{exitPhase ? (
					<button
						type="button"
						aria-hidden="true"
						tabIndex={-1}
						disabled
						className={`inline-flex h-9 items-center justify-center overflow-hidden rounded-full text-ink-soft transition-[width,opacity,transform] duration-200 ease-out ${
							exitPhase === "shown"
								? "w-9 scale-100 opacity-100"
								: "w-0 scale-50 opacity-0"
						}`}
					>
						<LosingIcon size={17} strokeWidth={1.5} />
					</button>
				) : null}

				<span
					className={`text-[11px] uppercase tracking-[0.2em] text-ink-soft ${
						justVoted ? "vote-thanks-in" : ""
					}`}
				>
					Gracias por tu ayuda
				</span>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="-ml-2 flex items-center gap-1">
			<button
				type="button"
				data-vote-value={1}
				aria-label="Votar a favor"
				aria-pressed={false}
				disabled={pending}
				onClick={() => vote(1)}
				className={iconButtonCls(false)}
			>
				<LikeIconOutline size={17} strokeWidth={1.5} />
			</button>
			<button
				type="button"
				data-vote-value={-1}
				aria-label="Votar en contra"
				aria-pressed={false}
				disabled={pending}
				onClick={() => vote(-1)}
				className={iconButtonCls(false)}
			>
				<DislikeIconOutline size={17} strokeWidth={1.5} />
			</button>
		</div>
	);
}
