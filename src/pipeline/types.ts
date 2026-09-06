import type { Category, PieceType } from "../data/pieces";
import type { PieceSourceProvider } from "../db/schema";

/**
 * A candidate fact pulled from an external source, before the LLM rewrite.
 * category/type are fixed by the harvester (deterministic per query/endpoint),
 * not guessed from free text — the lesson from seed-wikipedia.ts's keyword
 * classifier is that topic-guessing from prose is fragile.
 */
export type RawCandidate = {
	sourceProvider: PieceSourceProvider;
	sourceExternalId: string;
	sourceUrl: string;
	sourceName: string;
	category: Category;
	type: PieceType;
	/** Structured facts in plain text — the only material the LLM is allowed to draw on. */
	facts: string;
	/** Supplementary prose (e.g. a Wikipedia paragraph) — context only, never the source of a claim. */
	context?: string;
};

export type DraftPiece = {
	label: string;
	title: string;
	context: string;
	tags?: string[];
};

export type VerificationVerdict = "supported" | "uncertain" | "unsupported";

export type VerificationResult = {
	verdict: VerificationVerdict;
	issues: string[];
};
