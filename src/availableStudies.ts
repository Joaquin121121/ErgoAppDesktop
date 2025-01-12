interface StudyPreview {
  equipment: string[];
  time: number;
  statsToMeasure: string[];
}

export interface Study {
  name: string;
  description: string;
  preview: StudyPreview;
}

export interface Studies {
  [key: string]: Study;
}

const availableStudies: Studies = {
  cmj: {
    name: "CMJ",
    description: "Salto en Movimiento",
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  squatJump: {
    name: "Squat Jump",
    description: "Salto de Sentadilla",
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  abalakov: {
    name: "Abalakov",
    description: "Salto en Movimiento",
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  dropJump: {
    name: "Drop Jump",
    description: "Salto de Caída",
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  bosco: {
    name: "BOSCO",
    description: "Combinación de Tests",
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 30,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  saltosMultiples: {
    name: "Saltos Múltiples",
    description: "Saltos Repetidos Continuos",
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
};

export const availableEquipment = [
  "Alfombra de Contacto",
  "Encoder Lineal",
  "Plataforma de Fuerza",
];

export const statsToMeasure = [
  "Potencia",
  "Explosividad",
  "Tren Inferior",
  "Tren Superior",
];

export default availableStudies;
