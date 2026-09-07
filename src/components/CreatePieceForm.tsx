import { ArrowRightIcon } from "@solar-icons/react/outline/arrow-right";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Wordmark } from "@/components/Logo";
import {
	type Category,
	categories,
	type PieceType,
	typeLabels,
} from "@/data/pieces";
import { useFocusTrap } from "@/lib/use-focus-trap";

export type NewPiece = {
	category: Category;
	type: PieceType;
	title: string;
	context: string;
};

const categoryEntries = Object.entries(categories) as [
	Category,
	{ label: string },
][];
const typeEntries = Object.entries(typeLabels) as [PieceType, string][];

const fieldLabel =
	"block text-[10px] uppercase tracking-[0.24em] text-ink-soft";
const fieldInput =
	"mt-2 w-full border-b border-ink/15 bg-transparent pb-2 font-display text-lg text-ink outline-none transition-colors duration-200 focus:border-ink/50 placeholder:text-ink/25";
const selectInput =
	"mt-2 w-full appearance-none border-b border-ink/15 bg-transparent pb-2 text-[13px] tracking-[0.02em] text-ink outline-none transition-colors duration-200 focus:border-ink/50";

export function CreatePieceForm({
	onSubmit,
	onClose,
}: {
	onSubmit: (piece: NewPiece) => void;
	onClose: () => void;
}) {
	const [title, setTitle] = useState("");
	const [context, setContext] = useState("");
	const [category, setCategory] = useState<Category>("history");
	const [type, setType] = useState<PieceType>("fact");
	const [error, setError] = useState<string | null>(null);
	const titleRef = useRef<HTMLInputElement>(null);
	const dialogRef = useFocusTrap<HTMLDivElement>();

	useEffect(() => {
		titleRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const t = title.trim();
		const c = context.trim();
		if (!t || !c) {
			setError("El título y el contexto son necesarios.");
			return;
		}
		if (t.length > 280 || c.length > 500) {
			setError("El texto es demasiado largo.");
			return;
		}
		onSubmit({ category, type, title: t, context: c });
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center px-6">
			<button
				type="button"
				aria-label="Cerrar"
				onClick={onClose}
				className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
			/>

			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label="Sugerir curiosidad"
				className="reveal-enter relative z-10 w-full max-w-130 border border-ink/10 bg-paper px-8 py-10 sm:px-12"
			>
				<Wordmark />
				<h2 className="mt-4 font-display text-3xl font-light text-ink">
					Sugerir curiosidad
				</h2>

				<form onSubmit={handleSubmit} className="mt-10 space-y-8">
					<div>
						<label htmlFor="piece-title" className={fieldLabel}>
							Título
						</label>
						<input
							id="piece-title"
							ref={titleRef}
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={280}
							placeholder="En esta isla…"
							className={fieldInput}
						/>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div>
							<label htmlFor="piece-category" className={fieldLabel}>
								Familia
							</label>
							<select
								id="piece-category"
								value={category}
								onChange={(e) => setCategory(e.target.value as Category)}
								className={selectInput}
							>
								{categoryEntries.map(([value, { label }]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="piece-type" className={fieldLabel}>
								Tipo
							</label>
							<select
								id="piece-type"
								value={type}
								onChange={(e) => setType(e.target.value as PieceType)}
								className={selectInput}
							>
								{typeEntries.map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="piece-context" className={fieldLabel}>
							Contexto
						</label>
						<textarea
							id="piece-context"
							value={context}
							onChange={(e) => setContext(e.target.value)}
							maxLength={500}
							rows={3}
							placeholder="Una línea de contexto: dónde, cuándo, quién…"
							className={`${fieldInput} resize-none text-base leading-relaxed`}
						/>
					</div>

					{error ? (
						<p className="text-[12px] tracking-[0.02em] text-ink-soft">
							{error}
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
							className="group relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-ink outline-none transition-opacity focus-visible:opacity-60"
						>
							<span className="relative">
								Guardar
								<span className="absolute -bottom-0.75 left-0 block h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-250 ease-out group-hover:scale-x-100 motion-reduce:transition-none" />
							</span>
							<span
								aria-hidden
								className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
							>
								<ArrowRightIcon size={14} strokeWidth={1.75} />
							</span>
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
}
