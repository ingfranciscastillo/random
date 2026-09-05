import { useState } from "react";

import { ReportForm } from "@/components/ReportForm";

export function ReportButton({ pieceId }: { pieceId: string }) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-opacity hover:opacity-60"
			>
				Reportar
			</button>
			{open ? (
				<ReportForm pieceId={pieceId} onClose={() => setOpen(false)} />
			) : null}
		</>
	);
}
