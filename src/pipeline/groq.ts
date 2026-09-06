const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

const MAX_RETRIES = 3;

function retryDelayMs(message: string, attempt: number): number {
	const match = message.match(/try again in ([\d.]+)s/i);
	if (match) return Math.ceil(Number(match[1]) * 1000) + 250;
	return 2 ** attempt * 1000;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGroq(
	messages: { role: "system" | "user"; content: string }[],
	options: { temperature: number },
): Promise<string | null> {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
	const model = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const res = await fetch(GROQ_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				response_format: { type: "json_object" },
				temperature: options.temperature,
				messages,
			}),
			signal: AbortSignal.timeout(30_000),
		});

		if (res.status === 429 && attempt < MAX_RETRIES) {
			const body = await res.text();
			await sleep(retryDelayMs(body, attempt));
			continue;
		}
		if (!res.ok) {
			throw new Error(`Groq call failed: ${res.status} ${await res.text()}`);
		}

		const data = (await res.json()) as {
			choices?: { message?: { content?: string } }[];
		};
		return data.choices?.[0]?.message?.content ?? null;
	}

	throw new Error("Groq call failed: exhausted retries on rate limit");
}
