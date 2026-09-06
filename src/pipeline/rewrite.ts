import { pieces as examplePieces } from "../data/pieces";
import { callGroq } from "./groq";
import type { DraftPiece, RawCandidate } from "./types";

/** Hand-picked, not a slice of a filter — chosen specifically because their
 * context line is a short tag (place/year), never a sentence that repeats
 * the title. That's the pattern the model kept missing before this list
 * was curated deliberately instead of taken from array order. */
const EXAMPLE_IDS = [
	"cassini-final",
	"krakatoa",
	"roman-concrete",
	"hedy",
	"voyager",
	"hitachi",
];
const FEW_SHOT_EXAMPLES = EXAMPLE_IDS.map((id) =>
	examplePieces.find((p) => p.id === id),
).filter((p) => p !== undefined);

function buildSystemPrompt(): string {
	const examples = FEW_SHOT_EXAMPLES.map(
		(p) =>
			`- título: "${p.title}"\n  contexto: "${p.context}"\n  tags: ${JSON.stringify(p.tags ?? [])}`,
	).join("\n");

	return `Sos el editor de "Random", un sitio que muestra una curiosidad a la vez, en español, con voz cálida y directa — nunca enciclopédica.

Reglas del "título": UNA sola frase corta con el hecho más sorprendente — elegí el ángulo más llamativo, no trates de meter todos los datos que tengas. Si "HECHOS" trae varios datos (tamaño, distancia, nombre de otro objeto, fecha), quedate con uno o dos como máximo; el resto se descarta. Apuntá a 90-160 caracteres; 280 es el techo absoluto, no la meta.
Reglas del "contexto": es una FICHA corta, no una segunda oración explicativa. Lugar y/o año, como una leyenda de foto: "Fin de la misión Cassini, 2017." o "Erupción del Krakatoa, Indonesia, 1883.". Nunca reformules ni repitas lo que ya dijo el título con otras palabras — si no tenés un dato de lugar/fecha distinto que agregar, dejá el contexto lo más corto posible, no lo alargues rellenando. Máximo 500 caracteres pero la meta real es menos de 80.
"label": nombre corto y humano de la entidad (2-4 palabras).
"tags": 2 a 4 palabras clave en minúscula, sin tildes si es más natural así, relacionadas al tema.

Ejemplos reales del tono del sitio (fijate el contraste entre el título, que cuenta el hecho, y el contexto, que es solo una ficha corta):
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
