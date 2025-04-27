export const disciplines = [
  "salud/estética",
  "fútbol",
  "tenis",
  "rugby",
  "básquet",
  "vóley",
  "running",
  "ciclismo ruta",
  "mountain bike",
  "natación",
  "atletismo velocidad",
  "artes marciales",
  "atletismo lanzamientos",
  "fisicoculturismo",
  "gimnasia deportiva",
  "hándbol",
  "judo",
  "patín artístico",
  "patín carrera",
  "hockey",
  "snowboard",
  "béisbol",
  "tenis de mesa",
  "golf",
  "surf",
  "squash",
  "pádel",
  "softball",
  "atletismo salto",
];

interface Discipline {
  id: string;
  label: string;
}

export const formattedDisciplines: Discipline[] = [
  {
    id: "healthAndAesthetics",
    label: "Salud/Estética",
  },
  {
    id: "football",
    label: "Fútbol",
  },
  {
    id: "tennis",
    label: "Tenis",
  },
  {
    id: "rugby",
    label: "Rugby",
  },
  {
    id: "basketball",
    label: "Básquet",
  },
  {
    id: "volleyball",
    label: "Vóley",
  },
  {
    id: "running",
    label: "Running",
  },
  {
    id: "roadCycling",
    label: "Ciclismo Ruta",
  },
  {
    id: "mountainBike",
    label: "Mountain Bike",
  },
  {
    id: "swimming",
    label: "Natación",
  },
  {
    id: "sprintAthletics",
    label: "Atletismo Velocidad",
  },
  {
    id: "martialArts",
    label: "Artes Marciales",
  },
  {
    id: "throwingAthletics",
    label: "Atletismo Lanzamientos",
  },
  {
    id: "bodybuilding",
    label: "Fisicoculturismo",
  },
  {
    id: "gymnastics",
    label: "Gimnasia Deportiva",
  },
  {
    id: "handball",
    label: "Hándbol",
  },
  {
    id: "judo",
    label: "Judo",
  },
  {
    id: "figureSkatting",
    label: "Patín Artístico",
  },
  {
    id: "speedSkatting",
    label: "Patín Carrera",
  },
  {
    id: "hockey",
    label: "Hockey",
  },
  {
    id: "snowboard",
    label: "Snowboard",
  },
  {
    id: "baseball",
    label: "Béisbol",
  },
  {
    id: "tableTennis",
    label: "Tenis de Mesa",
  },
  {
    id: "golf",
    label: "Golf",
  },
  {
    id: "surf",
    label: "Surf",
  },
  {
    id: "squash",
    label: "Squash",
  },
  {
    id: "padel",
    label: "Pádel",
  },
  {
    id: "softball",
    label: "Softball",
  },
  {
    id: "jumpingAthletics",
    label: "Atletismo Salto",
  },
];
export const studiesInfo = {
  abalakov: {
    name: "Salto Abalakov",
    shortDesc: "Mide la altura del salto vertical con balanceo de brazos",
    longDesc:
      "Test de salto vertical realizado con contramovimiento y balanceo de brazos, que mide la potencia explosiva total del cuerpo",
    equipment: ["Alfombra de Contacto"],
    measures: [
      "Altura del salto (cm)",
      "Tiempo de vuelo (ms)",
      "Potencia (W/kg)",
    ],
    trainingApplications:
      "Los resultados permiten ajustar el entrenamiento de potencia y pliometría. Un bajo rendimiento puede indicar necesidad de mejorar la coordinación entre miembros superiores e inferiores o incrementar el trabajo de fuerza explosiva",
  },

  cmj: {
    name: "Salto con Contramovimiento",
    shortDesc:
      "Mide la altura del salto vertical desde posición de pie con manos en la cadera",
    longDesc:
      "Test de salto que inicia desde posición erguida, realizando un movimiento rápido hacia abajo seguido de un movimiento explosivo hacia arriba manteniendo las manos en la cadera",
    equipment: ["Alfombra de Contacto"],
    measures: [
      "Altura del salto (cm)",
      "Tiempo de vuelo (ms)",
      "Potencia (W/kg)",
      "Tiempo de contramovimiento (ms)",
    ],
    trainingApplications:
      "Permite evaluar la capacidad del ciclo estiramiento-acortamiento. Valores bajos pueden sugerir necesidad de mejorar la fuerza explosiva o la técnica del contramovimiento",
  },

  squatJump: {
    name: "Salto desde Sentadilla",
    shortDesc:
      "Mide la altura del salto vertical desde posición estática de sentadilla sin contramovimiento",
    longDesc:
      "Test de salto que inicia desde una flexión de rodilla de 90 grados, midiendo la potencia muscular puramente concéntrica sin beneficio del ciclo estiramiento-acortamiento",
    equipment: ["Alfombra de Contacto"],
    measures: [
      "Altura del salto (cm)",
      "Tiempo de vuelo (ms)",
      "Potencia concéntrica (W/kg)",
    ],
    trainingApplications:
      "La comparación con el CMJ (índice de elasticidad) ayuda a determinar si el atleta necesita más trabajo de fuerza máxima o potencia explosiva",
  },

  multipleDropJump: {
    name: "Salto en Caída",
    shortDesc:
      "Mide la fuerza reactiva saltando inmediatamente después de caer desde una altura",
    longDesc:
      "Test de salto pliométrico realizado al bajar de una plataforma y rebotar inmediatamente hacia arriba, evaluando la eficiencia del ciclo estiramiento-acortamiento",
    equipment: ["Alfombra de Contacto"],
    measures: [
      "Altura del salto (cm)",
      "Tiempo de contacto (ms)",
      "Índice de fuerza reactiva (altura/tiempo de contacto)",
    ],
    trainingApplications:
      "Ayuda a optimizar la altura del cajón para entrenamiento pliométrico y evaluar la capacidad reactiva. Un tiempo de contacto alto sugiere necesidad de mejorar la stiffness muscular",
  },

  multipleJumps: {
    name: "Test de Saltos Múltiples",
    shortDesc:
      "Evalúa el rendimiento en saltos repetidos y la resistencia a la potencia durante saltos consecutivos",
    longDesc:
      "Serie de saltos verticales máximos consecutivos (generalmente 5-10) que miden el mantenimiento de la potencia y la resistencia a la fatiga",
    equipment: ["Alfombra de Contacto"],
    measures: [
      "Altura media de saltos (cm)",
      "Índice de fatiga (%)",
      "Tiempo de contacto medio (ms)",
    ],
    trainingApplications:
      "Permite ajustar el volumen de series pliométricas y detectar necesidades de resistencia a la potencia. Una alta fatiga sugiere trabajar la resistencia específica",
  },

  bosco: {
    name: "Test de Bosco",
    shortDesc:
      "Evalúa la potencia anaeróbica y la fatiga mediante saltos continuos durante 15-60 segundos",
    longDesc:
      "Protocolo estandarizado de saltos máximos continuos de duración variable (15s, 30s, 60s) para evaluar la potencia de salida y el índice de fatiga",
    equipment: ["Alfombra de Contacto"],
    measures: [
      "Potencia media (W/kg)",
      "Índice de fatiga (%)",
      "Altura media de saltos (cm)",
      "Número total de saltos",
    ],
    trainingApplications:
      "Los resultados ayudan a planificar el entrenamiento de resistencia anaeróbica láctica y aláctica. Un alto índice de fatiga indica necesidad de mejorar la capacidad anaeróbica",
  },
};

export const VALIDATION_LIMITS = {
  weight: {
    kgs: { max: 200 },
    lbs: { max: 440 },
  },
  height: {
    cm: { max: 230 },
    ft: { max: 7 },
  },
};
