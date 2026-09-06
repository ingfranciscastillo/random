import { pieces as examplePieces } from "../data/pieces";
import { callGroq } from "./groq";
import type { DraftPiece, RawCandidate } from "./types";

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
- Toda cifra, fecha o nombre propio en tu respuesta debe aparecer literalmente en "HECHOS". Si te paso un "CONTEXTO ADICIONAL" de Wikipedia, usalo únicamente para elegir mejores palabras o entender mejor el tema — nunca para sumar una fecha, cifra o dato que no esté ya en HECHOS, aunque sea verdadero.
- Si los hechos no alcanzan para una curiosidad interesante, igual redactá lo mejor posible con lo que hay — no inventes para rellenar.
- Al escribir números de miles, usá el formato con espacio como separador (ej. "4 000") solo si preferís esa forma; ambas se validan igual.
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
	const userPrompt = `HECHOS:\n${candidate.facts}${
		candidate.context
			? `\n\nCONTEXTO ADICIONAL (Wikipedia, solo para color, no inventes nada que no esté ya en HECHOS):\n${candidate.context}`
			: ""
	}\n\nCategoría: ${candidate.category}. Tipo: ${candidate.type}.`;

	const content = await callGroq(
		[
			{ role: "system", content: buildSystemPrompt() },
			{ role: "user", content: userPrompt },
		],
		{ temperature: 0.7 },
	);
	if (!content) return null;

	try {
		return validateDraft(JSON.parse(content));
	} catch {
		return null;
	}
}
