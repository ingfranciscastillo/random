import type {
	DraftPiece,
	RawCandidate,
	VerificationResult,
	VerificationVerdict,
} from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

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

/** Cheap deterministic guard: every 4-digit year or number mentioned in the draft should appear literally in the raw facts. */
function numericGroundingIssues(draft: DraftPiece, facts: string): string[] {
	const draftNumbers = new Set(
		`${draft.title} ${draft.context}`.match(/\b\d{2,4}\b/g) ?? [],
	);
	const factNumbers = new Set(facts.match(/\b\d{2,4}\b/g) ?? []);
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

	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
	const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;

	const userPrompt = `HECHOS:\n${candidate.facts}\n\nCURIOSIDAD REDACTADA:\ntítulo: ${draft.title}\ncontexto: ${draft.context}`;

	const res = await fetch(GROQ_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			response_format: { type: "json_object" },
			temperature: 0,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: userPrompt },
			],
		}),
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		throw new Error(`Groq verify failed: ${res.status} ${await res.text()}`);
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content;
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
