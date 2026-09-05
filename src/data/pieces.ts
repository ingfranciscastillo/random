export type Category =
	| "history"
	| "science"
	| "culture"
	| "nature"
	| "geography"
	| "technology"
	| "space"
	| "language"
	| "food"
	| "art"
	| "architecture"
	| "psychology"
	| "mathematics"
	| "internet"
	| "transport"
	| "records"
	| "people"
	| "objects";

export type PieceType =
	| "fact"
	| "story"
	| "place"
	| "word"
	| "person"
	| "object"
	| "event"
	| "record"
	| "question";

export type Piece = {
	id: string;
	category: Category;
	type: PieceType;
	label: string;
	title: string;
	context: string;
	source?: {
		name: string;
		url: string;
	};
	tags?: string[];
};

/** Familias de curiosidades: etiqueta visible y color de acento. */
export const categories: Record<Category, { label: string; accent: string }> = {
	history: { label: "Historia", accent: "oklch(0.646 0.109 55.6)" },
	science: { label: "Ciencia", accent: "oklch(0.573 0.043 234)" },
	culture: { label: "Cultura", accent: "oklch(0.578 0.121 33)" },
	nature: { label: "Naturaleza", accent: "oklch(0.545 0.062 140)" },
	geography: { label: "Geografía", accent: "oklch(0.585 0.07 195)" },
	technology: { label: "Tecnología", accent: "oklch(0.56 0.045 265)" },
	space: { label: "Espacio", accent: "oklch(0.52 0.07 300)" },
	language: { label: "Lenguaje", accent: "oklch(0.6 0.08 85)" },
	food: { label: "Comida", accent: "oklch(0.62 0.11 45)" },
	art: { label: "Arte", accent: "oklch(0.575 0.095 15)" },
	architecture: { label: "Arquitectura", accent: "oklch(0.545 0.03 70)" },
	psychology: { label: "Psicología", accent: "oklch(0.56 0.06 330)" },
	mathematics: { label: "Matemáticas", accent: "oklch(0.55 0.04 210)" },
	internet: { label: "Internet", accent: "oklch(0.575 0.06 175)" },
	transport: { label: "Transporte", accent: "oklch(0.56 0.075 245)" },
	records: { label: "Récords", accent: "oklch(0.61 0.1 70)" },
	people: { label: "Humanidad", accent: "oklch(0.59 0.055 20)" },
	objects: { label: "Objetos", accent: "oklch(0.555 0.05 110)" },
};

/** Cómo se anuncia cada pieza: "Una palabra", "Un lugar"… */
export const typeLabels: Record<PieceType, string> = {
	fact: "Un hecho",
	story: "Una historia",
	place: "Un lugar",
	word: "Una palabra",
	person: "Una persona",
	object: "Un objeto",
	event: "Un acontecimiento",
	record: "Un récord",
	question: "Una pregunta",
};

export const pieces: Piece[] = [
	{
		id: "hitachi",
		category: "architecture",
		type: "place",
		label: "Estación de Hitachi",
		title:
			"En Hitachi, Japón, una estación de tren fue construida entera de cristal para que el andén pareciera flotar sobre el Pacífico.",
		context: "Prefectura de Ibaraki — abierta en 2011.",
		tags: ["japón", "cristal", "trenes"],
	},
	{
		id: "sealand",
		category: "geography",
		type: "place",
		label: "Sealand",
		title:
			"Una plataforma antiaérea abandonada en el Mar del Norte se declaró país soberano en 1967 y todavía emite pasaportes.",
		context: "Principado de Sealand, frente a la costa de Suffolk.",
		tags: ["micronaciones", "fronteras"],
	},
	{
		id: "library",
		category: "history",
		type: "place",
		label: "Timbuctú",
		title:
			"La biblioteca de Timbuctú guardaba manuscritos de astronomía escritos siglos antes de que Europa los redescubriera.",
		context: "Mali, entre los siglos XIII y XVI.",
		tags: ["manuscritos", "áfrica"],
	},
	{
		id: "postbox",
		category: "objects",
		type: "object",
		label: "Buzón submarino",
		title:
			"Hay un buzón de correo a diez metros bajo el agua, en Susami, y su cartero baja buceando a recoger las cartas.",
		context: "Bahía de Susami, Japón — decenas de miles de cartas enviadas.",
		tags: ["correo", "japón"],
	},
	{
		id: "roman-concrete",
		category: "architecture",
		type: "fact",
		label: "Hormigón romano",
		title:
			"El hormigón romano se vuelve más fuerte con el tiempo porque el agua de mar cristaliza minerales nuevos dentro de sus grietas.",
		context: "Puertos del Mediterráneo construidos hace más de dos mil años.",
		tags: ["materiales", "roma"],
	},
	{
		id: "svalbard",
		category: "geography",
		type: "place",
		label: "Longyearbyen",
		title:
			"En Longyearbyen no se entierra a nadie: el permafrost conserva los cuerpos y nunca terminan de descomponerse.",
		context: "Svalbard, Noruega, a 78 grados de latitud norte.",
		tags: ["ártico", "permafrost"],
	},
	{
		id: "nazca",
		category: "history",
		type: "place",
		label: "Líneas de Nazca",
		title:
			"Las líneas de Nazca sobrevivieron dos milenios porque el desierto donde están casi nunca tiene viento ni lluvia.",
		context: "Pampa de Jumana, Perú.",
		tags: ["perú", "desierto"],
	},
	{
		id: "tardigrade",
		category: "nature",
		type: "fact",
		label: "Tardígrado",
		title:
			"Un tardígrado puede detener su metabolismo casi por completo y esperar años hasta que vuelva el agua.",
		context: "Criptobiosis — descrita por primera vez en el siglo XVIII.",
		tags: ["animales", "supervivencia"],
	},
	{
		id: "helium",
		category: "space",
		type: "event",
		label: "Eclipse de 1868",
		title:
			"El helio se descubrió en el Sol antes que en la Tierra: apareció como una línea amarilla durante un eclipse.",
		context: "Espectroscopía solar, Guntur, India, 1868.",
		tags: ["sol", "espectros"],
	},
	{
		id: "sound-map",
		category: "technology",
		type: "fact",
		label: "Cartografía marina",
		title:
			"Los mapas más precisos del fondo del océano se dibujan con sonido, porque la luz no llega tan abajo.",
		context: "Solo una parte del lecho marino está cartografiada con detalle.",
		tags: ["sonar", "océano"],
	},
	{
		id: "voyager",
		category: "space",
		type: "object",
		label: "Voyager 1",
		title:
			"La Voyager 1 sigue enviando datos con menos memoria que una tarjeta de felicitación musical.",
		context: "Lanzada en 1977, hoy más allá de la heliosfera.",
		source: { name: "NASA — Voyager", url: "https://voyager.jpl.nasa.gov/" },
		tags: ["misiones", "nasa"],
	},
	{
		id: "glass-frog",
		category: "nature",
		type: "fact",
		label: "Rana de cristal",
		title:
			"La rana de cristal se vuelve casi transparente al dormir escondiendo su propia sangre en el hígado.",
		context: "Bosques nubosos de Centroamérica.",
		tags: ["animales", "camuflaje"],
	},
	{
		id: "clock-atomic",
		category: "science",
		type: "record",
		label: "Relojes ópticos",
		title:
			"Los relojes atómicos más precisos de hoy perderían menos de un segundo en la edad entera del universo.",
		context: "Relojes de red óptica de estroncio.",
		tags: ["tiempo", "metrología"],
	},
	{
		id: "mushroom-network",
		category: "nature",
		type: "fact",
		label: "Redes micorrízicas",
		title:
			"Bajo un bosque, los hongos conectan raíces de árboles distintos y trasladan azúcares entre ellos.",
		context: "Estudiadas de forma sistemática desde los años noventa.",
		tags: ["hongos", "bosques"],
	},
	{
		id: "blue-pigment",
		category: "art",
		type: "fact",
		label: "Color estructural",
		title:
			"El azul casi no existe como pigmento en la naturaleza: la mayoría de los animales azules solo doblan la luz.",
		context: "Alas de mariposa morpho, plumas de arrendajo.",
		tags: ["color", "óptica"],
	},
	{
		id: "bookship",
		category: "language",
		type: "word",
		label: "Islandés",
		title: "Jólabókaflóð",
		context:
			"La inundación de libros de Navidad: la avalancha de títulos que se publican en Islandia justo antes de las fiestas.",
		tags: ["islandia", "libros"],
	},
	{
		id: "kintsugi",
		category: "culture",
		type: "fact",
		label: "Kintsugi",
		title:
			"El kintsugi repara la cerámica rota con oro, para que la fractura sea la parte más visible del objeto.",
		context: "Japón, desde el siglo XV.",
		tags: ["japón", "cerámica"],
	},
	{
		id: "silence-piece",
		category: "art",
		type: "story",
		label: "Organ²/ASLSP",
		title:
			"Hay una obra de órgano que se está tocando ahora mismo en Alemania y terminará en el año 2640.",
		context: "John Cage, iglesia de San Burchardi, Halberstadt.",
		tags: ["música", "cage"],
	},
	{
		id: "saudade",
		category: "language",
		type: "word",
		label: "Portugués",
		title: "Saudade",
		context:
			"La nostalgia de algo que quizá nunca ocurrió. Documentada en la poesía galaico-portuguesa del siglo XIII.",
		tags: ["nostalgia", "poesía"],
	},
	{
		id: "blue-hour",
		category: "art",
		type: "word",
		label: "Pintura",
		title: "Hora azul",
		context:
			"El breve momento en que el cielo ya no tiene sol pero todavía tiene luz. Unos veinte minutos, dos veces al día.",
		tags: ["luz", "cielo"],
	},
	{
		id: "bread-archive",
		category: "food",
		type: "fact",
		label: "Masa madre",
		title:
			"Existen masas madre alimentadas sin interrupción durante más de un siglo, heredadas como una reliquia familiar.",
		context: "Panaderías de California y del Yukón.",
		tags: ["pan", "fermentación"],
	},
	{
		id: "manuscript-margin",
		category: "history",
		type: "fact",
		label: "Copistas",
		title:
			"Los copistas medievales escribían quejas en los márgenes: sobre el frío, la tinta mala y lo mucho que faltaba.",
		context: "Colofones de manuscritos irlandeses y alemanes.",
		tags: ["manuscritos", "escritura"],
	},
	{
		id: "wabi",
		category: "culture",
		type: "word",
		label: "Japonés",
		title: "Wabi-sabi",
		context:
			"La idea de que algo solo se vuelve hermoso cuando empieza a mostrar el paso del tiempo. Estética del té japonés.",
		tags: ["estética", "japón"],
	},
	{
		id: "barcode",
		category: "objects",
		type: "object",
		label: "Código de barras",
		title:
			"El código de barras nació como una idea dibujada en la arena de una playa: círculos concéntricos, no líneas.",
		context:
			"Norman Joseph Woodland, Miami Beach, finales de los años cuarenta.",
		tags: ["diseño", "inventos"],
	},
	{
		id: "dancing-plague",
		category: "history",
		type: "story",
		label: "Estrasburgo, 1518",
		title:
			"En 1518, decenas de personas empezaron a bailar en las calles de Estrasburgo sin poder parar durante semanas.",
		context: "La llamada epidemia de baile; sus causas siguen discutiéndose.",
		tags: ["epidemias", "multitudes"],
	},
	{
		id: "krakatoa",
		category: "records",
		type: "record",
		label: "Krakatoa",
		title:
			"El sonido más fuerte registrado se escuchó a casi cinco mil kilómetros de distancia y dio varias veces la vuelta al mundo.",
		context: "Erupción del Krakatoa, Indonesia, 1883.",
		tags: ["volcanes", "sonido"],
	},
	{
		id: "dot-com-first",
		category: "internet",
		type: "fact",
		label: "Primer dominio",
		title:
			"El primer dominio .com del mundo se registró en 1985 para una fabricante de ordenadores que ya no existe.",
		context: "symbolics.com — hoy conservado como pieza de museo.",
		tags: ["dominios", "web"],
	},
	{
		id: "ping-timeout",
		category: "internet",
		type: "fact",
		label: "Protocolos",
		title:
			"El código 418 del web significa oficialmente 'soy una tetera', y nació como una broma de abril que nadie quiso retirar.",
		context: "Hyper Text Coffee Pot Control Protocol, 1998.",
		tags: ["http", "humor"],
	},
	{
		id: "banach-tarski",
		category: "mathematics",
		type: "fact",
		label: "Paradoja",
		title:
			"Hay un teorema que demuestra que una esfera puede partirse y recomponerse en dos esferas idénticas a la original.",
		context: "Paradoja de Banach-Tarski, 1924.",
		tags: ["paradojas", "geometría"],
	},
	{
		id: "birthday",
		category: "mathematics",
		type: "question",
		label: "Probabilidad",
		title:
			"¿Cuántas personas hacen falta en una sala para que sea más probable que dos compartan cumpleaños que lo contrario",
		context:
			"Veintitrés. Es la paradoja del cumpleaños, y casi nadie la acierta.",
		tags: ["probabilidad", "intuición"],
	},
	{
		id: "tetris-effect",
		category: "psychology",
		type: "fact",
		label: "Efecto Tetris",
		title:
			"Después de jugar mucho a un juego de piezas, el cerebro empieza a encajar formas en el mundo real y en los sueños.",
		context: "Descrito como efecto Tetris a comienzos de los noventa.",
		tags: ["memoria", "sueños"],
	},
	{
		id: "mcgurk",
		category: "psychology",
		type: "fact",
		label: "Percepción",
		title:
			"Si ves unos labios decir una sílaba y oyes otra distinta, tu cerebro inventa una tercera que nadie pronunció.",
		context: "Efecto McGurk, descrito en 1976.",
		tags: ["sesgos", "audición"],
	},
	{
		id: "bell-boeing",
		category: "transport",
		type: "fact",
		label: "Aviación",
		title:
			"En los aviones se sirve zumo de tomate más de lo normal porque el ruido de cabina apaga el dulce y realza el umami.",
		context: "Estudios de percepción del sabor a presión reducida.",
		tags: ["aviones", "sabor"],
	},
	{
		id: "sail-train",
		category: "transport",
		type: "object",
		label: "Vagoneta a vela",
		title:
			"En el ferrocarril del Congo y en otros ramales remotos se usaron vagonetas impulsadas por velas de tela.",
		context: "Primeras décadas del siglo XX.",
		tags: ["trenes", "viento"],
	},
	{
		id: "hedy",
		category: "people",
		type: "person",
		label: "Hedy Lamarr",
		title:
			"Una actriz de Hollywood coinventó un sistema de salto de frecuencias que hoy vive dentro del wifi y el bluetooth.",
		context: "Hedy Lamarr y George Antheil, patente de 1942.",
		tags: ["inventos", "radio"],
	},
	{
		id: "dunbar",
		category: "people",
		type: "fact",
		label: "Vínculos",
		title:
			"Se ha propuesto que una persona solo puede mantener alrededor de ciento cincuenta relaciones estables a la vez.",
		context: "Número de Dunbar — una estimación, no una ley.",
		tags: ["comportamiento", "grupos"],
	},
	{
		id: "pineapple",
		category: "food",
		type: "story",
		label: "Piña",
		title:
			"En el siglo XVIII una piña costaba tanto que la gente rica la alquilaba solo para llevarla del brazo a una fiesta.",
		context: "Inglaterra georgiana.",
		tags: ["fruta", "lujo"],
	},
	{
		id: "vantablack",
		category: "science",
		type: "record",
		label: "Negro extremo",
		title:
			"Existen recubrimientos que absorben casi toda la luz que reciben: un objeto pintado con ellos parece un agujero.",
		context: "Bosques de nanotubos de carbono.",
		tags: ["luz", "materiales"],
	},
	{
		id: "eiffel-grow",
		category: "architecture",
		type: "fact",
		label: "Torre Eiffel",
		title:
			"La Torre Eiffel es unos centímetros más alta en verano: el hierro se dilata con el calor.",
		context: "París — 330 metros aproximados.",
		tags: ["hierro", "parís"],
	},
	{
		id: "cuneiform-complaint",
		category: "objects",
		type: "object",
		label: "Tablilla de Ea-nasir",
		title:
			"La queja de cliente más antigua que se conserva está grabada en barro y se refiere a un lote de cobre de mala calidad.",
		context: "Ur, hacia el año 1750 antes de nuestra era.",
		tags: ["comercio", "escritura"],
	},
	{
		id: "boustrophedon",
		category: "language",
		type: "word",
		label: "Escritura",
		title: "Bustrofedón",
		context:
			"Escribir alternando la dirección de cada línea, como un buey al arar. Se usó en el griego arcaico.",
		tags: ["alfabetos", "grecia"],
	},
	{
		id: "sky-color",
		category: "geography",
		type: "question",
		label: "Atmósfera",
		title: "¿Por qué el horizonte de un desierto puede parecer agua a lo lejos",
		context:
			"Porque el aire caliente junto al suelo dobla la luz del cielo hacia arriba: lo que ves es cielo, no agua.",
		tags: ["mirajes", "luz"],
	},
	{
		id: "shipping-forecast",
		category: "culture",
		type: "fact",
		label: "Radio",
		title:
			"El parte marítimo de la radio británica se lee con un ritmo tan fijo que mucha gente lo escucha para dormirse.",
		context: "Shipping Forecast, emitido desde 1924.",
		tags: ["radio", "rituales"],
	},
	{
		id: "cassini-final",
		category: "space",
		type: "event",
		label: "Cassini",
		title:
			"Una sonda fue lanzada deliberadamente contra Saturno para no contaminar nunca sus lunas con vida terrestre.",
		context: "Fin de la misión Cassini, 2017.",
		source: {
			name: "NASA — Cassini",
			url: "https://science.nasa.gov/mission/cassini/",
		},
		tags: ["saturno", "misiones"],
	},
	{
		id: "hummingbird-night",
		category: "nature",
		type: "fact",
		label: "Colibríes",
		title:
			"Un colibrí entra cada noche en un estado de sueño profundo en el que su corazón baja de cientos de latidos a unas decenas.",
		context: "Torpor nocturno.",
		tags: ["aves", "metabolismo"],
	},
	{
		id: "longest-word-map",
		category: "records",
		type: "record",
		label: "Topónimos",
		title:
			"Hay una colina en Nueva Zelanda cuyo nombre maorí ocupa más de ochenta letras y cuenta una historia entera.",
		context: "Taumata­whakatangihanga­koauau­o­tamatea…",
		tags: ["nombres", "maorí"],
	},
	{
		id: "typewriter-qwerty",
		category: "technology",
		type: "object",
		label: "QWERTY",
		title:
			"El teclado que usas hoy conserva la disposición de una máquina mecánica del siglo XIX que ya nadie fabrica.",
		context: "Patentada por Sholes y Glidden en los años setenta del XIX.",
		tags: ["teclados", "inercia"],
	},
	{
		id: "gutenberg-color",
		category: "art",
		type: "fact",
		label: "Iluminación",
		title:
			"Las primeras Biblias impresas se dejaban con huecos en blanco para que un pintor añadiera las iniciales a mano.",
		context: "Maguncia, mediados del siglo XV.",
		tags: ["imprenta", "libros"],
	},
];
