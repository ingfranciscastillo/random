import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/Logo";
import { adminLogin } from "@/server/admin-auth";

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
				<Wordmark suffix="Admin" />
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

export function AdminGate({
	authed,
	onSuccess,
	children,
}: {
	authed: boolean;
	onSuccess: () => void;
	children: React.ReactNode;
}) {
	if (!authed) return <LoginGate onSuccess={onSuccess} />;
	return <>{children}</>;
}
