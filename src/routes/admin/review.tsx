import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { categories, typeLabels } from "@/data/pieces";
import type { PieceSource, PieceSourceProvider } from "@/db/schema";
import { adminLogin, getAdminAuthStatus } from "@/server/admin-auth";
import { listPieces, reviewPiece } from "@/server/moderation";

type PendingPiece = Awaited<ReturnType<typeof listPieces>>[number];

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
	component: AdminReviewPage,
});

function AdminReviewPage() {
	const { authed } = Route.useLoaderData();
	const router = useRouter();

	if (!authed) {
		return <LoginGate onSuccess={() => router.invalidate()} />;
	}
	return <ReviewQueue />;
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const passwordRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		passwordRef.current?.focus();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setPending(true);
		setError(null);
		try {
			await adminLogin({ data: { password } });
			onSuccess();
		} catch {
			setError("Contraseña incorrecta.");
		} finally {
			setPending(false);
		}
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-paper px-6">
			<form onSubmit={handleSubmit} className="w-full max-w-80 space-y-6">
				<p className="text-[10px] uppercase tracking-[0.34em] text-ink-soft">
					Random — Admin
				</p>
				<div>
					<label
						htmlFor="admin-password"
						className="block text-[10px] uppercase tracking-[0.24em] text-ink-soft"
					>
						Contraseña
					</label>
					<input
						id="admin-password"
						ref={passwordRef}
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-2 w-full border-b border-ink/15 bg-transparent pb-2 text-base text-ink outline-none transition-colors duration-200 focus:border-ink/50"
					/>
				</div>
				{error ? (
					<p className="text-[12px] tracking-[0.02em] text-ink-soft">{error}</p>
				) : null}
				<button
					type="submit"
					disabled={pending || !password}
					className="text-[11px] uppercase tracking-[0.24em] text-ink transition-opacity hover:opacity-60 disabled:opacity-30"
				>
					Entrar
				</button>
			</form>
		</main>
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
	const [items, setItems] = useState<PendingPiece[] | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setItems(null);
		listPieces({ data: { status } }).then((rows) => {
			if (!cancelled) setItems(rows);
		});
		return () => {
			cancelled = true;
		};
	}, [status]);

	const decide = async (id: string, decision: "approved" | "rejected") => {
		setBusyId(id);
		try {
			await reviewPiece({ data: { id, decision } });
			setItems((prev) => prev?.filter((p) => p.id !== id) ?? prev);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<main className="min-h-screen bg-paper px-6 py-14 sm:px-10">
			<div className="mx-auto max-w-180">
				<p className="text-[10px] uppercase tracking-[0.34em] text-ink-soft">
					Random — Admin
				</p>
				<h1 className="mt-3 font-display text-3xl font-light text-ink">
					Revisión de contenido
				</h1>

				<div className="mt-8 flex gap-6 border-b border-ink/10 pb-3">
					{statusTabs.map((tab) => (
						<button
							key={tab.value}
							type="button"
							onClick={() => setStatus(tab.value)}
							className={`text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70 ${
								status === tab.value ? "text-ink" : "text-ink-soft"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className="mt-8 space-y-6">
					{items === null ? (
						<p className="text-[13px] text-ink-soft">Cargando…</p>
					) : items.length === 0 ? (
						<p className="text-[13px] text-ink-soft">Nada por aquí.</p>
					) : (
						items.map((piece) => (
							<article
								key={piece.id}
								className="border border-ink/10 px-6 py-6 sm:px-8"
							>
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

								<h2 className="mt-4 font-display text-xl font-light text-ink">
									{piece.title}
								</h2>
								<p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
									{piece.context}
								</p>

								{status === "pending" && piece.verificationNotes ? (
									<p className="mt-3 text-[12px] uppercase tracking-[0.18em] leading-relaxed text-ink-soft">
										Revisar: {piece.verificationNotes}
									</p>
								) : null}

								{status === "pending" ? (
									<div className="mt-6 flex items-center gap-6">
										<button
											type="button"
											disabled={busyId === piece.id}
											onClick={() => decide(piece.id, "approved")}
											className="text-[11px] uppercase tracking-[0.24em] text-ink transition-opacity hover:opacity-60 disabled:opacity-30"
										>
											Aceptar
										</button>
										<button
											type="button"
											disabled={busyId === piece.id}
											onClick={() => decide(piece.id, "rejected")}
											className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
										>
											Descartar
										</button>
									</div>
								) : null}
							</article>
						))
					)}
				</div>
			</div>
		</main>
	);
}
