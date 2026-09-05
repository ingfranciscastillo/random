export function RevealDots() {
	return (
		<output className="flex items-center gap-2" aria-label="Cargando">
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className="dot-pulse block h-1.25 w-1.25 rounded-full accent-shift"
					style={{
						backgroundColor: "var(--accent)",
						animation: "dot-pulse 1.2s linear infinite",
						animationDelay: `${i * 0.2}s`,
					}}
				/>
			))}
		</output>
	);
}
