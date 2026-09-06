import { callGroq } from "./groq";
import type {
	DraftPiece,
	RawCandidate,
	VerificationResult,
	VerificationVerdict,
} from "./types";

const SYSTEM_PROMPT = `Sos un verificador estricto. Te paso HECHOS (la única fuente de verdad) y una CURIOSIDAD redactada a partir de ellos.
Tu trabajo es chequear que la curiosidad no contenga ninguna afirmación, cifra, fecha o nombre que no esté respaldado por HECHOS.
Respondé ÚNICAMENTE un objeto JSON: { "verdict": "supported" | "uncertain" | "unsupported", "issues": string[] }.
- "supported": todo lo dicho está respaldado por HECHOS.
- "uncertain": hay algo plausible pero no puedes confirmarlo del todo con HECHOS (ambigüedad, no invención clara).
- "unsupported": hay una afirmación concreta que HECHOS no respalda.
"issues" lista brevemente cada problema encontrado (vacío si no hay ninguno).`;

function isVerdict(v: unknown): v is VerificationVerdict {
	return v === "supported" || v === "uncertain" || v === "unsupported";
}

/** Spanish groups thousands with a space ("4 000"); collapse that before comparing so it matches the raw "4000" in facts. */
function collapseThousands(text: string): string {
	return text.replace(/(\d)[ .](?=\d{3}\b)/g, "$1");
}

/** Cheap deterministic guard: every 4-digit year or number mentioned in the draft should appear literally in the raw facts. */
function numericGroundingIssues(draft: DraftPiece, facts: string): string[] {
	const draftNumbers = new Set(
		collapseThousands(`${draft.title} ${draft.context}`).match(
			/\b\d{2,4}\b/g,
		) ?? [],
	);
	const factNumbers = new Set(
		collapseThousands(facts).match(/\b\d{2,4}\b/g) ?? [],
	);
	return [...draftNumbers]
		.filter((n) => !factNumbers.has(n))
		.map((n) => `El número/año "${n}" no aparece en los hechos originales.`);
}

export async function verifyDraft(
	candidate: RawCandidate,
	draft: DraftPiece,
): Promise<VerificationResult> {
	const numericIssues = numericGroundingIssues(draft, candidate.facts);
	if (numericIssues.length > 0) {
		return { verdict: "unsupported", issues: numericIssues };
	}

	const userPrompt = `HECHOS:\n${candidate.facts}\n\nCURIOSIDAD REDACTADA:\ntítulo: ${draft.title}\ncontexto: ${draft.context}`;

	const content = await callGroq(
		[
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: userPrompt },
		],
		{ temperature: 0 },
	);
	if (!content)
		return {
			verdict: "uncertain",
			issues: ["El verificador no devolvió respuesta."],
		};

	try {
		const parsed = JSON.parse(content) as {
			verdict?: unknown;
			issues?: unknown;
		};
		if (!isVerdict(parsed.verdict)) {
			return {
				verdict: "uncertain",
				issues: ["Respuesta de verificación con formato inválido."],
			};
		}
		const issues = Array.isArray(parsed.issues)
			? parsed.issues.filter((i): i is string => typeof i === "string")
			: [];
		return { verdict: parsed.verdict, issues };
	} catch {
		return {
			verdict: "uncertain",
			issues: ["No se pudo interpretar la respuesta del verificador."],
		};
	}
}
