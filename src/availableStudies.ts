// Base interfaces
interface BaseStudyPreview {
  equipment: string[];
  time: number;
  statsToMeasure: string[];
}

interface BaseStudy {
  name: string;
  description: string;
  preview: BaseStudyPreview;
}

type LoadUnit = "kgs" | "lbs";

// Modify the interfaces that have load
interface CMJStudy extends BaseStudy {
  type: "cmj";
  takeoffFoot: "right" | "left" | "both";
  load: number;
  loadUnit: LoadUnit;
  sensitivity: number;
}

interface SquatJumpStudy extends BaseStudy {
  type: "squatJump";
  takeoffFoot: "right" | "left" | "both";
  load: number;
  loadUnit: LoadUnit;
  sensitivity: number;
}

interface AbalakovStudy extends BaseStudy {
  type: "abalakov";
  takeoffFoot: "right" | "left" | "both";
  load: number;
  loadUnit: LoadUnit;
  sensitivity: number;
}

interface DropJumpStudy extends BaseStudy {
  type: "dropJump";
  takeoffFoot: "right" | "left" | "both";
  load: number;
  loadUnit: LoadUnit;
  sensitivity: number;
}

interface BoscoStudy extends BaseStudy {
  type: "bosco";
  studies: (keyof Omit<Studies, "bosco">)[];
  // Bosco-specific properties
}

interface MultipleJumpsStudy extends BaseStudy {
  type: "multipleJumps";
  takeoffFoot: "right" | "left" | "both";
  criteria: "numberOfJumps" | "stiffness" | "time";
  time: number;
  sensitivity: number;
  // MultipleJumps-specific properties
}

export interface NewStudy extends BaseStudy {
  jumpTypes: "simple" | "multiple";
}

// Union type of all possible studies
export type Study =
  | CMJStudy
  | SquatJumpStudy
  | AbalakovStudy
  | DropJumpStudy
  | BoscoStudy
  | MultipleJumpsStudy;

// Type-safe lookup object type
export interface Studies {
  cmj: CMJStudy;
  squatJump: SquatJumpStudy;
  abalakov: AbalakovStudy;
  dropJump: DropJumpStudy;
  bosco: BoscoStudy;
  multipleJumps: MultipleJumpsStudy;
}

const availableStudies: Studies = {
  cmj: {
    type: "cmj",
    name: "CMJ",
    description: "Salto en Movimiento",
    takeoffFoot: "both",
    load: 0,
    loadUnit: "kgs",
    sensitivity: 0.8,
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  squatJump: {
    type: "squatJump",
    name: "Squat Jump",
    description: "Salto de Sentadilla",
    takeoffFoot: "both",
    load: 0,
    loadUnit: "kgs",
    sensitivity: 0.8,
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  abalakov: {
    type: "abalakov",
    name: "Abalakov",
    description: "Salto en Movimiento",
    takeoffFoot: "both",
    load: 0,
    loadUnit: "kgs",
    sensitivity: 0.8,
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior", "Potencia"],
    },
  },
  dropJump: {
    type: "dropJump",
    name: "Drop Jump",
    description: "Salto de Caída",
    takeoffFoot: "both",
    load: 20,
    loadUnit: "kgs",
    sensitivity: 0.8,
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 5,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  bosco: {
    type: "bosco",
    name: "BOSCO",
    description: "Combinación de Tests",
    studies: ["cmj", "squatJump", "abalakov", "multipleJumps"],
    preview: {
      equipment: ["Alfombra de Contacto"],
      time: 30,
      statsToMeasure: ["Fuerza explosiva en tren inferior"],
    },
  },
  multipleJumps: {
    type: "multipleJumps",
    name: "Saltos Múltiples",
    description: "Saltos Repetidos Continuos",
    takeoffFoot: "both",
    criteria: "numberOfJumps",
    time: 30,
    sensitivity: 0.8,
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
] as const;

export const statsToMeasure = [
  "Potencia",
  "Explosividad",
  "Tren Inferior",
  "Tren Superior",
] as const;

export default availableStudies;
