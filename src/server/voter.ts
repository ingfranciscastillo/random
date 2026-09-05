import { getCookie, setCookie } from "@tanstack/react-start/server";

const VOTER_COOKIE = "voter_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Anonymous per-visitor id backing votes/reports — not tied to any account. */
export function getOrCreateVoterId(): string {
	const existing = getCookie(VOTER_COOKIE);
	if (existing) return existing;

	const id = crypto.randomUUID();
	setCookie(VOTER_COOKIE, id, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: ONE_YEAR_SECONDS,
	});
	return id;
}
