import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";
import { Wordmark } from "@/components/Logo";
import { categories, typeLabels } from "@/data/pieces";
import type { ReportStatus } from "@/db/schema";
import { reportReasons } from "@/lib/report-reasons";
import {
	listReports,
	listVoteStats,
	updateReportStatus,
	type VoteSort,
} from "@/server/admin-activity";
import { getAdminAuthStatus } from "@/server/admin-auth";
import { reviewPiece } from "@/server/moderation";

export const Route = createFileRoute("/admin/activity")({
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
	component: AdminActivityPage,
});

function AdminActivityPage() {
	const { authed } = Route.useLoaderData();
	const router = useRouter();

	return (
		<AdminGate authed={authed} onSuccess={() => router.invalidate()}>
			<ActivityView />
		</AdminGate>
	);
}

const reasonLabels: Record<string, string> = Object.fromEntries(
	reportReasons.map((r) => [r.value, r.label]),
);

const tabs: { value: "reports" | "votes"; label: string }[] = [
	{ value: "reports", label: "Reportes" },
	{ value: "votes", label: "Votos" },
];

function ActivityView() {
	const [tab, setTab] = useState<"reports" | "votes">("reports");

	return (
		<main className="min-h-screen bg-paper px-6 py-14 sm:px-10">
			<div className="mx-auto max-w-180">
				<Wordmark suffix="Admin" />
				<AdminNav />
				<h1 className="mt-3 font-display text-3xl font-light text-ink">
					Actividad
				</h1>

				<div className="mt-8 flex gap-6 border-b border-ink/10 pb-3">
					{tabs.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => setTab(t.value)}
							className={`text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70 ${
								tab === t.value ? "text-ink" : "text-ink-soft"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				<div className="mt-8">
					{tab === "reports" ? <ReportsPanel /> : <VotesPanel />}
				</div>
			</div>
		</main>
	);
}

const reportStatusTabs: { value: ReportStatus; label: string }[] = [
	{ value: "open", label: "Abiertos" },
	{ value: "reviewed", label: "Revisados" },
	{ value: "dismissed", label: "Descartados" },
];

function ReportsPanel() {
	const [status, setStatus] = useState<ReportStatus>("open");
	const [page, setPage] = useState(1);
	const [result, setResult] = useState<Awaited<
		ReturnType<typeof listReports>
	> | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setResult(null);
		listReports({ data: { status, page } }).then((res) => {
			if (!cancelled) setResult(res);
		});
		return () => {
			cancelled = true;
		};
	}, [status, page]);

	const setReportStatus = async (id: string, next: ReportStatus) => {
		setBusyId(id);
		try {
			await updateReportStatus({ data: { id, status: next } });
			setResult((prev) =>
				prev
					? {
							...prev,
							items: prev.items.filter((r) => r.id !== id),
							total: prev.total - 1,
						}
					: prev,
			);
		} finally {
			setBusyId(null);
		}
	};

	const rejectPiece = async (id: string, pieceId: string) => {
		setBusyId(id);
		try {
			await reviewPiece({ data: { id: pieceId, decision: "rejected" } });
			await updateReportStatus({ data: { id, status: "reviewed" } });
			setResult((prev) =>
				prev
					? {
							...prev,
							items: prev.items.filter((r) => r.id !== id),
							total: prev.total - 1,
						}
					: prev,
			);
		} finally {
			setBusyId(null);
		}
	};

	const totalPages = result
		? Math.max(1, Math.ceil(result.total / result.pageSize))
		: 1;

	return (
		<>
			<div className="flex gap-6">
				{reportStatusTabs.map((t) => (
					<button
						key={t.value}
						type="button"
						onClick={() => {
							setStatus(t.value);
							setPage(1);
						}}
						className={`text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70 ${
							status === t.value ? "text-ink" : "text-ink-soft"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			<div className="mt-6 space-y-6">
				{result === null ? (
					<p className="text-[13px] text-ink-soft">Cargando…</p>
				) : result.items.length === 0 ? (
					<p className="text-[13px] text-ink-soft">Nada por aquí.</p>
				) : (
					result.items.map((report) => (
						<article
							key={report.id}
							className="border border-ink/10 px-6 py-6 sm:px-8"
						>
							<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
									<span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
										{reasonLabels[report.reason] ?? report.reason}
									</span>
									{report.pieceCategory ? (
										<span className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">
											{categories[report.pieceCategory]?.label ??
												report.pieceCategory}
										</span>
									) : null}
								</div>
								<p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
									{new Date(report.createdAt).toLocaleString()}
								</p>
							</div>

							<h2 className="mt-4 font-display text-lg font-light text-ink">
								{report.pieceTitle ?? "Pieza eliminada"}
							</h2>
							{report.note ? (
								<p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
									{report.note}
								</p>
							) : null}

							<div className="mt-6 flex flex-wrap items-center gap-6">
								{status !== "reviewed" ? (
									<button
										type="button"
										disabled={busyId === report.id}
										onClick={() => setReportStatus(report.id, "reviewed")}
										className="text-[11px] uppercase tracking-[0.24em] text-ink transition-opacity hover:opacity-60 disabled:opacity-30"
									>
										Marcar revisado
									</button>
								) : null}
								{status !== "dismissed" ? (
									<button
										type="button"
										disabled={busyId === report.id}
										onClick={() => setReportStatus(report.id, "dismissed")}
										className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
									>
										Descartar reporte
									</button>
								) : null}
								{report.pieceStatus === "approved" ? (
									<button
										type="button"
										disabled={busyId === report.id}
										onClick={() => rejectPiece(report.id, report.pieceId)}
										className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
									>
										Rechazar pieza
									</button>
								) : null}
							</div>
						</article>
					))
				)}
			</div>

			{result && result.total > result.pageSize ? (
				<Pagination page={page} totalPages={totalPages} onChange={setPage} />
			) : null}
		</>
	);
}

const voteSortTabs: { value: VoteSort; label: string }[] = [
	{ value: "likes", label: "Más gustadas" },
	{ value: "dislikes", label: "Más rechazadas" },
	{ value: "total", label: "Más votadas" },
];

function VotesPanel() {
	const [sort, setSort] = useState<VoteSort>("likes");
	const [page, setPage] = useState(1);
	const [result, setResult] = useState<Awaited<
		ReturnType<typeof listVoteStats>
	> | null>(null);

	useEffect(() => {
		let cancelled = false;
		setResult(null);
		listVoteStats({ data: { sort, page } }).then((res) => {
			if (!cancelled) setResult(res);
		});
		return () => {
			cancelled = true;
		};
	}, [sort, page]);

	const totalPages = result
		? Math.max(1, Math.ceil(result.total / result.pageSize))
		: 1;

	return (
		<>
			<div className="flex gap-6">
				{voteSortTabs.map((t) => (
					<button
						key={t.value}
						type="button"
						onClick={() => {
							setSort(t.value);
							setPage(1);
						}}
						className={`text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70 ${
							sort === t.value ? "text-ink" : "text-ink-soft"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			<div className="mt-6 space-y-3">
				{result === null ? (
					<p className="text-[13px] text-ink-soft">Cargando…</p>
				) : result.items.length === 0 ? (
					<p className="text-[13px] text-ink-soft">Nada por aquí.</p>
				) : (
					result.items.map((row) => (
						<div
							key={row.id}
							className="flex items-center justify-between gap-4 border-b border-ink/10 py-3"
						>
							<div className="min-w-0">
								<p className="truncate font-display text-base font-light text-ink">
									{row.title}
								</p>
								<p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
									{categories[row.category]?.label ?? row.category} ·{" "}
									{typeLabels[row.type]}
									{row.status !== "approved" ? ` · ${row.status}` : ""}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-4 text-[13px] text-ink-soft">
								<span>{row.likes} likes</span>
								<span>{row.dislikes} dislikes</span>
							</div>
						</div>
					))
				)}
			</div>

			{result && result.total > result.pageSize ? (
				<Pagination page={page} totalPages={totalPages} onChange={setPage} />
			) : null}
		</>
	);
}

function Pagination({
	page,
	totalPages,
	onChange,
}: {
	page: number;
	totalPages: number;
	onChange: (page: number) => void;
}) {
	return (
		<div className="mt-10 flex items-center justify-between">
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onChange(page - 1)}
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
				onClick={() => onChange(page + 1)}
				className="text-[11px] uppercase tracking-[0.24em] text-ink-soft transition-opacity hover:opacity-60 disabled:opacity-30"
			>
				Siguiente
			</button>
		</div>
	);
}
