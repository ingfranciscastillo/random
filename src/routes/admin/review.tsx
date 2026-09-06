import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";
import { Wordmark } from "@/components/Logo";
import { categories, typeLabels } from "@/data/pieces";
import type { PieceSource, PieceSourceProvider } from "@/db/schema";
import { getAdminAuthStatus } from "@/server/admin-auth";
import {
	listPieces,
	regeneratePiece,
	reviewPiece,
	updatePiece,
} from "@/server/moderation";

type PendingPiece = Awaited<ReturnType<typeof listPieces>>["items"][number];

const PROVIDER_LABELS: Record<PieceSourceProvider, string> = {
	wikidata: "Wikidata",
	nasa: "NASA",
	"wikipedia-seed": "Wikipedia",
};

function sourceLabel(
	submittedBy: PieceSource,
	provider: PieceSourceProvider | null,
): string {
	if (provider) return PROVIDER_LABELS[provider];
	return submittedBy === "seed" ? "Seed" : "Visitante";
}

export const Route = createFileRoute("/admin/review")({
	loader: async () => {
		const { authed } = await getAdminAuthStatus();
		return { authed };
	},
	head: () => ({
		meta: [
			{ title: "Random — Admin" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	component: AdminReviewPage,
});

function AdminReviewPage() {
	const { authed } = Route.useLoaderData();
	const router = useRouter();

	return (
		<AdminGate authed={authed} onSuccess={() => router.invalidate()}>
			<ReviewQueue />
		</AdminGate>
	);
}

const statusTabs: {
	value: "pending" | "approved" | "rejected";
	label: string;
}[] = [
	{ value: "pending", label: "Pendientes" },
	{ value: "approved", label: "Aprobadas" },
	{ value: "rejected", label: "Descartadas" },
];

function ReviewQueue() {
	const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
		"pending",
	);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(1);
	const [result, setResult] = useState<Awaited<
		ReturnType<typeof listPieces>
	> | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
		return () => window.clearTimeout(timeout);
	}, [search]);

	useEffect(() => {
		let cancelled = false;
		setResult(null);
		listPieces({
			data: {
				status,
				search: status === "pending" ? undefined : debouncedSearch,
				page,
			},
		}).then((res) => {
			if (!cancelled) setResult(res);
		});
		return () => {
			cancelled = true;
		};
	}, [status, debouncedSearch, page]);

	const items = result?.items ?? null;
	const totalPages = result
		? Math.max(1, Math.ceil(result.total / result.pageSize))
		: 1;

	const decide = async (id: string, decision: "approved" | "rejected") => {
		setBusyId(id);
		try {
			await reviewPiece({ data: { id, decision } });
			setResult((prev) =>
				prev
					? {
							...prev,
							items: prev.items.filter((p) => p.id !== id),
							total: prev.total - 1,
						}
					: prev,
			);
		} finally {
			setBusyId(null);
		}
	};

	const replace = (updated: PendingPiece) => {
		setResult((prev) =>
			prev
				? {
						...prev,
						items: prev.items.map((p) => (p.id === updated.id ? updated : p)),
					}
				: prev,
		);
	};

	return (
		<main className="min-h-screen bg-paper px-6 py-14 sm:px-10">
			<div className="mx-auto max-w-180">
				<Wordmark suffix="Admin" />
				<AdminNav />
				<h1 className="mt-3 font-display text-3xl font-light text-ink">
					Revisión de contenido
				</h1>

				<div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-3">
					<div className="flex gap-6">
						{statusTabs.map((tab) => (
							<button
								key={tab.value}
								type="button"
								onClick={() => {
									setStatus(tab.value);
									setPage(1);
								}}
								className={`text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70 ${
									status === tab.value ? "text-ink" : "text-ink-soft"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
					{status !== "pending" ? (
						<input
							type="search"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Buscar por título, contexto o label…"
							className="w-full max-w-70 border-b border-ink/15 bg-transparent pb-1 text-[13px] text-ink outline-none focus:border-ink/50"
						/>
					) : null}
				</div>

				<div className="mt-8 space-y-6">
					{items === null ? (
						<p className="text-[13px] text-ink-soft">Cargando…</p>
					) : items.length === 0 ? (
						<p className="text-[13px] text-ink-soft">Nada por aquí.</p>
					) : (
						items.map((piece) => (
							<PieceCard
								key={piece.id}
								piece={piece}
								pending={status === "pending"}
								busy={busyId === piece.id}
								onDecide={(decision) => decide(piece.id, decision)}
								onUpdated={replace}
							/>
						))
					)}
				</div>

				{result && result.total > result.pageSize ? (
					<div className="mt-10 flex items-center justify-between">
						<button
							type="button"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
							className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
						>
							Anterior
						</button>
						<p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
							Página {page} de {totalPages}
						</p>
						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => setPage((p) => p + 1)}
							className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
						>
							Siguiente
						</button>
					</div>
				) : null}
			</div>
		</main>
	);
}

function PieceCard({
	piece,
	pending,
	busy,
	onDecide,
	onUpdated,
}: {
	piece: PendingPiece;
	pending: boolean;
	busy: boolean;
	onDecide: (decision: "approved" | "rejected") => void;
	onUpdated: (updated: PendingPiece) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [label, setLabel] = useState(piece.label);
	const [title, setTitle] = useState(piece.title);
	const [context, setContext] = useState(piece.context);
	const [tags, setTags] = useState((piece.tags ?? []).join(", "));
	const [feedback, setFeedback] = useState("");
	const [showFeedback, setShowFeedback] = useState(false);
	const [aiBusy, setAiBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resetFields = () => {
		setLabel(piece.label);
		setTitle(piece.title);
		setContext(piece.context);
		setTags((piece.tags ?? []).join(", "));
	};

	const saveEdit = async () => {
		setError(null);
		try {
			const updated = await updatePiece({
				data: {
					id: piece.id,
					label,
					title,
					context,
					tags: tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean),
				},
			});
			if (updated) onUpdated(updated);
			setEditing(false);
		} catch {
			setError("No se pudo guardar. Revisá los campos.");
		}
	};

	const regenerate = async () => {
		setAiBusy(true);
		setError(null);
		try {
			const result = await regeneratePiece({
				data: { id: piece.id, feedback: feedback || undefined },
			});
			if (result.piece) {
				onUpdated(result.piece);
				setLabel(result.piece.label);
				setTitle(result.piece.title);
				setContext(result.piece.context);
				setTags((result.piece.tags ?? []).join(", "));
			}
			setShowFeedback(false);
			setFeedback("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Falló la reescritura.");
		} finally {
			setAiBusy(false);
		}
	};

	return (
		<article className="border border-ink/10 px-6 py-6 sm:px-8">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<p className="text-[11px] uppercase tracking-[0.22em] text-ink">
						{typeLabels[piece.type]}
					</p>
					<span className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">
						{categories[piece.category]?.label ?? piece.category}
					</span>
					<span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
						{sourceLabel(piece.submittedBy, piece.sourceProvider)}
					</span>
				</div>
				<p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
					{new Date(piece.createdAt).toLocaleString()}
				</p>
			</div>

			{editing ? (
				<div className="mt-4 space-y-3">
					<div>
						<label
							htmlFor={`label-${piece.id}`}
							className="block text-[10px] uppercase tracking-[0.2em] text-ink-soft"
						>
							Label
						</label>
						<input
							id={`label-${piece.id}`}
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							className="mt-1 w-full border-b border-ink/15 bg-transparent pb-1 text-[14px] text-ink outline-none focus:border-ink/50"
						/>
					</div>
					<div>
						<label
							htmlFor={`title-${piece.id}`}
							className="block text-[10px] uppercase tracking-[0.2em] text-ink-soft"
						>
							Título
						</label>
						<textarea
							id={`title-${piece.id}`}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							rows={2}
							className="mt-1 w-full resize-none border-b border-ink/15 bg-transparent pb-1 font-display text-lg font-light text-ink outline-none focus:border-ink/50"
						/>
					</div>
					<div>
						<label
							htmlFor={`context-${piece.id}`}
							className="block text-[10px] uppercase tracking-[0.2em] text-ink-soft"
						>
							Contexto
						</label>
						<textarea
							id={`context-${piece.id}`}
							value={context}
							onChange={(e) => setContext(e.target.value)}
							rows={2}
							className="mt-1 w-full resize-none border-b border-ink/15 bg-transparent pb-1 text-[13px] text-ink-soft outline-none focus:border-ink/50"
						/>
					</div>
					<div>
						<label
							htmlFor={`tags-${piece.id}`}
							className="block text-[10px] uppercase tracking-[0.2em] text-ink-soft"
						>
							Tags (separados por coma)
						</label>
						<input
							id={`tags-${piece.id}`}
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							className="mt-1 w-full border-b border-ink/15 bg-transparent pb-1 text-[13px] text-ink outline-none focus:border-ink/50"
						/>
					</div>
				</div>
			) : (
				<>
					<h2 className="mt-4 font-display text-xl font-light text-ink">
						{title}
					</h2>
					<p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
						{context}
					</p>
				</>
			)}

			{pending && piece.verificationNotes ? (
				<p className="mt-3 text-[12px] uppercase tracking-[0.18em] leading-relaxed text-ink-soft">
					Revisar: {piece.verificationNotes}
				</p>
			) : null}

			{error ? (
				<p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
					{error}
				</p>
			) : null}

			{showFeedback ? (
				<div className="mt-4 space-y-2">
					<label
						htmlFor={`feedback-${piece.id}`}
						className="block text-[10px] uppercase tracking-[0.2em] text-ink-soft"
					>
						Qué ajustar (ej: "no digas meseta, los hechos dicen macizo")
					</label>
					<textarea
						id={`feedback-${piece.id}`}
						value={feedback}
						onChange={(e) => setFeedback(e.target.value)}
						rows={2}
						className="w-full resize-none border-b border-ink/15 bg-transparent pb-1 text-[13px] text-ink outline-none focus:border-ink/50"
					/>
				</div>
			) : null}

			<div className="mt-6 flex flex-wrap items-center gap-6">
				{editing ? (
					<>
						<button
							type="button"
							onClick={saveEdit}
							className="text-[11px] uppercase tracking-[0.24em] text-ink transition-opacity hover:opacity-60"
						>
							Guardar
						</button>
						<button
							type="button"
							onClick={() => {
								resetFields();
								setEditing(false);
							}}
							className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60"
						>
							Cancelar
						</button>
					</>
				) : (
					<>
						{pending ? (
							<>
								<button
									type="button"
									disabled={busy}
									onClick={() => onDecide("approved")}
									className="text-[11px] uppercase tracking-[0.24em] text-ink transition-opacity hover:opacity-60 disabled:opacity-30"
								>
									Aceptar
								</button>
								<button
									type="button"
									disabled={busy}
									onClick={() => onDecide("rejected")}
									className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
								>
									Descartar
								</button>
							</>
						) : null}
						<button
							type="button"
							onClick={() => setEditing(true)}
							className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60"
						>
							Editar
						</button>
						{pending && piece.sourceFacts ? (
							showFeedback ? (
								<button
									type="button"
									disabled={aiBusy}
									onClick={regenerate}
									className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
								>
									{aiBusy ? "Reescribiendo…" : "Confirmar reescritura"}
								</button>
							) : (
								<button
									type="button"
									onClick={() => setShowFeedback(true)}
									className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60"
								>
									Reescribir con IA
								</button>
							)
						) : null}
					</>
				)}
			</div>
		</article>
	);
}
