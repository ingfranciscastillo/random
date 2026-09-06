import { Link } from "@tanstack/react-router";

const base =
	"text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70";

export function AdminNav() {
	return (
		<nav className="mt-6 flex gap-6">
			<Link
				to="/admin/review"
				className={`${base} text-ink-soft`}
				activeProps={{ className: `${base} text-ink` }}
			>
				Revisión
			</Link>
			<Link
				to="/admin/activity"
				className={`${base} text-ink-soft`}
				activeProps={{ className: `${base} text-ink` }}
			>
				Actividad
			</Link>
		</nav>
	);
}
