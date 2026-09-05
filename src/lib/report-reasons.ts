export type ReportReason =
	| "incorrect"
	| "duplicate"
	| "offensive"
	| "spam"
	| "broken_link"
	| "other";

export const reportReasons: { value: ReportReason; label: string }[] = [
	{ value: "incorrect", label: "Dato incorrecto" },
	{ value: "duplicate", label: "Repetida" },
	{ value: "offensive", label: "Contenido ofensivo" },
	{ value: "spam", label: "Spam" },
	{ value: "broken_link", label: "Enlace roto" },
	{ value: "other", label: "Otro" },
];
