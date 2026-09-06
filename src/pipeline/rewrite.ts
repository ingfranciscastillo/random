import { pieces as examplePieces } from "../data/pieces";
import type { DraftPiece, RawCandidate } from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

const FEW_SHOT_EXAMPLES = examplePieces
	.filter(
		(p) =>
			p.type === "fact" ||
			p.type === "place" ||
			p.type === "event" ||
			p.type === "record" ||
			p.type === "person" ||
			p.type === "object",
	)
	.slice(0, 6);

function buildSystemPrompt(): string {
	const examples = FEW_SHOT_EXAMPLES.map(
		(p) =>
			`- título: "${p.title}"\n  contexto: "${p.context}"\n  tags: ${JSON.stringify(p.tags ?? [])}`,
	).join("\n");

	return `Sos el editor de "Random", un sitio que muestra una curiosidad a la vez, en español, con voz cálida y directa — nunca enciclopédica.

Reglas del "título": una sola frase que ES la curiosidad completa (el hecho sorprendente en sí), no un titular ni un nombre propio suelto. Máximo 280 caracteres.
Reglas del "contexto": uno o dos datos de apoyo (dónde, cuándo, quién) en un renglón corto. Máximo 500 caracteres. Nunca repite palabra por palabra el título.
"label": nombre corto y humano de la entidad (2-4 palabras).
"tags": 2 a 4 palabras clave en minúscula, sin tildes si es más natural así, relacionadas al tema.

Ejemplos reales del tono del sitio:
${examples}

Reglas estrictas:
- Toda afirmación en tu respuesta debe estar respaldada por los "HECHOS" que te paso — no inventes fechas, nombres, cifras ni detalles que no estén ahí.
- Si los hechos no alcanzan para una curiosidad interesante, igual redactá lo mejor posible con lo que hay — no inventes para rellenar.
- Respondé ÚNICAMENTE un objeto JSON con las claves: label, title, context, tags (array de strings). Sin texto adicional.`;
}

function validateDraft(raw: unknown): DraftPiece | null {
	if (!raw || typeof raw !== "object") return null;
	const obj = raw as Record<string, unknown>;
	const label = typeof obj.label === "string" ? obj.label.trim() : "";
	const title = typeof obj.title === "string" ? obj.title.trim() : "";
	const context = typeof obj.context === "string" ? obj.context.trim() : "";
	const tags = Array.isArray(obj.tags)
		? obj.tags.filter((t): t is string => typeof t === "string").slice(0, 4)
		: undefined;

	if (!label || !title || !context) return null;
	if (title.length > 280 || context.length > 500) return null;

	return { label, title, context, tags };
}

export async function rewriteCandidate(
	candidate: RawCandidate,
): Promise<DraftPiece | null> {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
	const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;

	const userPrompt = `HECHOS:\n${candidate.facts}${
		candidate.context
			? `\n\nCONTEXTO ADICIONAL (Wikipedia, solo para color, no inventes nada que no esté ya en HECHOS):\n${candidate.context}`
			: ""
	}\n\nCategoría: ${candidate.category}. Tipo: ${candidate.type}.`;

	const res = await fetch(GROQ_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			response_format: { type: "json_object" },
			temperature: 0.7,
			messages: [
				{ role: "system", content: buildSystemPrompt() },
				{ role: "user", content: userPrompt },
			],
		}),
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		throw new Error(`Groq rewrite failed: ${res.status} ${await res.text()}`);
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content;
	if (!content) return null;

	try {
		return validateDraft(JSON.parse(content));
	} catch {
		return null;
	}
}
