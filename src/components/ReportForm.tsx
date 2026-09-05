import { useEffect, useRef, useState } from "react";

import { type ReportReason, reportReasons } from "@/lib/report-reasons";
import { createReport } from "@/server/reports";

export function ReportForm({
	pieceId,
	onClose,
}: {
	pieceId: string;
	onClose: () => void;
}) {
	const [reason, setReason] = useState<ReportReason>(reportReasons[0].value);
	const [note, setNote] = useState("");
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
		"idle",
	);
	const firstRadioRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		firstRadioRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("sending");
		try {
			await createReport({
				data: { pieceId, reason, note: note.trim() || undefined },
			});
			setStatus("sent");
			window.setTimeout(onClose, 900);
		} catch {
			setStatus("error");
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-6">
			<button
				type="button"
				aria-label="Cerrar"
				onClick={onClose}
				className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
			/>

			<div
				role="dialog"
				aria-modal="true"
				aria-label="Reportar pieza"
				className="reveal-enter relative z-10 w-full max-w-110 border border-ink/10 bg-paper px-8 py-10 sm:px-12"
			>
				<p className="text-[10px] uppercase tracking-[0.34em] text-ink-soft">
					Random
				</p>
				<h2 className="mt-4 font-display text-2xl font-light text-ink">
					Reportar
				</h2>

				{status === "sent" ? (
					<p className="mt-8 text-[13px] leading-relaxed text-ink-soft">
						Gracias, lo revisamos.
					</p>
				) : (
					<form onSubmit={handleSubmit} className="mt-8 space-y-7">
						<div className="space-y-3">
							{reportReasons.map((option, i) => (
								<label
									key={option.value}
									className="flex cursor-pointer items-center gap-3 text-[13px] tracking-[0.02em] text-ink"
								>
									<input
										ref={i === 0 ? firstRadioRef : undefined}
										type="radio"
										name="reason"
										value={option.value}
										checked={reason === option.value}
										onChange={() => setReason(option.value)}
										className="accent-[var(--accent)]"
									/>
									{option.label}
								</label>
							))}
						</div>

						<div>
							<label
								htmlFor="report-note"
								className="block text-[10px] uppercase tracking-[0.24em] text-ink-soft"
							>
								Nota (opcional)
							</label>
							<textarea
								id="report-note"
								value={note}
								onChange={(e) => setNote(e.target.value)}
								maxLength={280}
								rows={2}
								className="mt-2 w-full resize-none border-b border-ink/15 bg-transparent pb-2 text-[13px] leading-relaxed text-ink outline-none transition-colors duration-200 focus:border-ink/50"
							/>
						</div>

						{status === "error" ? (
							<p className="text-[12px] tracking-[0.02em] text-ink-soft">
								No se pudo enviar. Intenta de nuevo.
							</p>
						) : null}

						<div className="flex items-center justify-between pt-2">
							<button
								type="button"
								onClick={onClose}
								className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={status === "sending"}
								className="group relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-ink outline-none transition-opacity focus-visible:opacity-60 disabled:opacity-50"
							>
								<span className="relative">
									Enviar
									<span className="absolute -bottom-0.75 left-0 block h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-250 ease-out group-hover:scale-x-100 motion-reduce:transition-none" />
								</span>
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
