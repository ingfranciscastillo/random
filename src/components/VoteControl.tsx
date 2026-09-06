import { DislikeIcon } from "@solar-icons/react/outline/dislike";
import { LikeIcon } from "@solar-icons/react/outline/like";
import { useEffect, useState } from "react";

import { castVote, getVoteState, type VoteValue } from "@/server/votes";

export function VoteControl({ pieceId }: { pieceId: string }) {
	const [score, setScore] = useState<number | null>(null);
	const [myVote, setMyVote] = useState<VoteValue | 0>(0);
	const [pending, setPending] = useState(false);
	const [tapped, setTapped] = useState<VoteValue | null>(null);

	useEffect(() => {
		let cancelled = false;
		setScore(null);
		setMyVote(0);
		getVoteState({ data: { pieceId } }).then((state) => {
			if (cancelled) return;
			setScore(state.score);
			setMyVote(state.myVote);
		});
		return () => {
			cancelled = true;
		};
	}, [pieceId]);

	const vote = async (value: VoteValue) => {
		if (pending) return;
		setPending(true);
		setTapped(value);
		window.setTimeout(() => setTapped(null), 100);

		const prevScore = score ?? 0;
		const prevVote = myVote;
		const next = prevVote === value ? 0 : value;
		setMyVote(next);
		setScore(prevScore - prevVote + next);

		try {
			const state = await castVote({ data: { pieceId, value } });
			setScore(state.score);
			setMyVote(state.myVote);
		} catch {
			setScore(prevScore);
			setMyVote(prevVote);
		} finally {
			setPending(false);
		}
	};

	const buttonCls = (active: boolean) =>
		`accent-shift inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-ink/5 disabled:opacity-30 ${
			active ? "text-accent" : ""
		}`;

	return (
		<div className="-ml-2 flex items-center gap-1">
			<button
				type="button"
				aria-label="Votar a favor"
				aria-pressed={myVote === 1}
				disabled={pending}
				onClick={() => vote(1)}
				className={buttonCls(myVote === 1)}
				style={{
					animation: tapped === 1 ? "press-tap 100ms linear" : undefined,
				}}
			>
				<LikeIcon size={17} strokeWidth={1.5} />
			</button>
			<span className="min-w-5 text-center text-[11px] tabular-nums text-ink-soft">
				{score === null ? "–" : score}
			</span>
			<button
				type="button"
				aria-label="Votar en contra"
				aria-pressed={myVote === -1}
				disabled={pending}
				onClick={() => vote(-1)}
				className={buttonCls(myVote === -1)}
				style={{
					animation: tapped === -1 ? "press-tap 100ms linear" : undefined,
				}}
			>
				<DislikeIcon size={17} strokeWidth={1.5} />
			</button>
		</div>
	);
}
