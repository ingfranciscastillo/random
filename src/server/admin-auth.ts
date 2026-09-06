import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const ADMIN_COOKIE = "admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

async function sha256Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(input),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

/** Throws unless the request carries a session cookie matching the configured admin password. Server-only: called from inside other server functions' handlers, never directly from the client. */
export const requireAdmin = createServerOnlyFn(async (): Promise<void> => {
	const password = process.env.ADMIN_PASSWORD;
	if (!password) throw new Error("ADMIN_PASSWORD is not configured");

	const token = getCookie(ADMIN_COOKIE);
	if (!token) throw new Error("Unauthorized");

	const expected = await sha256Hex(password);
	if (!timingSafeEqual(token, expected)) throw new Error("Unauthorized");
});

export const getAdminAuthStatus = createServerFn().handler(async () => {
	try {
		await requireAdmin();
		return { authed: true } as const;
	} catch {
		return { authed: false } as const;
	}
});

export const adminLogin = createServerFn({ method: "POST" })
	.validator((data: { password: string }) => {
		if (typeof data?.password !== "string" || !data.password) {
			throw new Error("password is required");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const expectedPassword = process.env.ADMIN_PASSWORD;
		if (!expectedPassword) throw new Error("ADMIN_PASSWORD is not configured");
		if (!timingSafeEqual(data.password, expectedPassword)) {
			throw new Error("Invalid password");
		}

		setCookie(ADMIN_COOKIE, await sha256Hex(expectedPassword), {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			secure: process.env.NODE_ENV === "production",
			maxAge: SESSION_SECONDS,
		});
		return { ok: true } as const;
	});

export const adminLogout = createServerFn({ method: "POST" }).handler(
	async () => {
		setCookie(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
		return { ok: true } as const;
	},
);
