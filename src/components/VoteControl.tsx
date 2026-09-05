import { useEffect, useState } from "react";

import { castVote, getVoteState, type VoteValue } from "@/server/votes";

export function VoteControl({ pieceId }: { pieceId: string }) {
	const [score, setScore] = useState<number | null>(null);
	const [myVote, setMyVote] = useState<VoteValue | 0>(0);
	const [pending, setPending] = useState(false);

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

	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				aria-label="Votar a favor"
				aria-pressed={myVote === 1}
				disabled={pending}
				onClick={() => vote(1)}
				className={`accent-shift text-[13px] leading-none transition-opacity hover:opacity-60 disabled:opacity-30 ${
					myVote === 1 ? "text-accent" : "text-ink-soft"
				}`}
			>
				↑
			</button>
			<span className="min-w-4 text-center text-[11px] tabular-nums text-ink-soft">
				{score === null ? "–" : score}
			</span>
			<button
				type="button"
				aria-label="Votar en contra"
				aria-pressed={myVote === -1}
				disabled={pending}
				onClick={() => vote(-1)}
				className={`accent-shift text-[13px] leading-none transition-opacity hover:opacity-60 disabled:opacity-30 ${
					myVote === -1 ? "text-accent" : "text-ink-soft"
				}`}
			>
				↓
			</button>
		</div>
	);
}
