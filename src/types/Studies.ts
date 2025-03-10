// Base interfaces
interface BaseStudyPreview {
  equipment: string[];
}

interface BaseStudy {
  name: string;
  description: string;
  preview: BaseStudyPreview;
}

type LoadUnit = "kgs" | "lbs";
type HeightUnit = "cm" | "ft";

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

export interface MultipleDropJumpStudy extends BaseStudy {
  takeoffFoot: "right" | "left" | "both";
  heightUnit: HeightUnit;
  sensitivity: number;
  type: "multipleDropJump";
  dropJumpHeights: string[];
}

interface BoscoStudy extends BaseStudy {
  type: "bosco";
  studies: ("squatJump" | "cmj" | "abalakov")[];
  // Bosco-specific properties
}

export const boscoTests = ["squatJump", "cmj", "abalakov"];

interface MultipleJumpsStudy extends BaseStudy {
  type: "multipleJumps";
  takeoffFoot: "right" | "left" | "both";
  criteria: "numberOfJumps" | "stiffness" | "time";
  criteriaValue: number | null;
  sensitivity: number;
  // MultipleJumps-specific properties
}

export interface NewStudy extends BaseStudy {
  type: "custom";
  jumpTypes: "simple" | "multiple";
  takeoffFoot: "right" | "left" | "both";
  load: number;
  sensitivity: number;
  loadUnit: LoadUnit;
}

// Union type of all possible studies
export type Study =
  | CMJStudy
  | SquatJumpStudy
  | AbalakovStudy
  | MultipleDropJumpStudy
  | BoscoStudy
  | MultipleJumpsStudy
  | NewStudy;

// Type-safe lookup object type
export interface Studies {
  cmj: CMJStudy;
  squatJump: SquatJumpStudy;
  abalakov: AbalakovStudy;
  multipleDropJump: MultipleDropJumpStudy;
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
    sensitivity: 10,
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  squatJump: {
    type: "squatJump",
    name: "Squat Jump",
    description: "Salto de Sentadilla",
    takeoffFoot: "both",
    load: 0,
    loadUnit: "kgs",
    sensitivity: 10,
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  abalakov: {
    type: "abalakov",
    name: "Abalakov",
    description: "Salto en Movimiento",
    takeoffFoot: "both",
    load: 0,
    loadUnit: "kgs",
    sensitivity: 10,
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  multipleDropJump: {
    type: "multipleDropJump",
    name: "Drop Jump",
    description: "Salto de Caída",
    takeoffFoot: "both",
    heightUnit: "cm",
    sensitivity: 10,
    dropJumpHeights: [],
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  bosco: {
    type: "bosco",
    name: "BOSCO Test",
    description: "Combinación de Tests",
    studies: ["squatJump", "cmj", "abalakov"],
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  multipleJumps: {
    type: "multipleJumps",
    name: "Test de Saltos Múltiples",
    description: "Saltos Repetidos Continuos",
    takeoffFoot: "both",
    criteria: "numberOfJumps",
    criteriaValue: 30,
    sensitivity: 10,
    preview: {
      equipment: ["Alfombra de Contacto"],
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

export interface JumpTime {
  time: number;
  deleted: boolean;
  floorTime?: number;
  stiffness?: number;
  performance?: number;
}

export interface StudyData {
  avgFlightTime: number;
  avgHeightReached: number;
  maxAvgHeightReached?: number;
  avgFloorTime?: number;
  avgPerformance?: number;
  avgStiffness?: number;
}

export interface BaseResult {
  times: JumpTime[];
  avgFlightTime: number;
  avgHeightReached: number;
  takeoffFoot: "right" | "left" | "both";
  sensitivity: number;
}

export interface CMJResult extends BaseResult {
  type: "cmj";
  load: number;
  loadUnit: LoadUnit;
}
export interface SquatJumpResult extends BaseResult {
  type: "squatJump";
  load: number;
  loadUnit: LoadUnit;
}
export interface AbalakovResult extends BaseResult {
  type: "abalakov";
  load: number;
  loadUnit: LoadUnit;
}
export interface CustomStudyResult extends BaseResult {
  type: "custom";
  load: number;
  loadUnit: LoadUnit;
}
export interface MultipleJumpsResult extends BaseResult {
  type: "multipleJumps";
  criteria: "numberOfJumps" | "stiffness" | "time";
  criteriaValue: number | null;
  avgFloorTime: number;
  stiffness: number[];
  performance: number[];
  avgStiffness: number;
  avgPerformance: number;
  performanceDrop: number;
}

export interface DropJumpResult extends BaseResult {
  type: "dropJump";
  height: string;
  stiffness: number;
}

export interface MultipleDropJumpResult {
  type: "multipleDropJump";
  dropJumps: DropJumpResult[];
  heightUnit: HeightUnit;
  maxAvgHeightReached: number;
  takeoffFoot: "right" | "left" | "both";
  bestHeight: string;
}

export interface BoscoResult {
  type: "bosco";
  cmj: CMJResult;
  squatJump: SquatJumpResult;
  abalakov: AbalakovResult;
}

export interface CompletedStudy {
  studyInfo: BaseStudy;
  date: Date | string;
  results:
    | CMJResult
    | BoscoResult
    | MultipleJumpsResult
    | MultipleDropJumpResult
    | AbalakovResult
    | SquatJumpResult
    | CustomStudyResult;
}

export const units = {
  flightTime: "s",
  avgFlightTime: "s",
  avgHeightReached: "cm",
  heightReached: "cm",
  avgStiffness: "N/m",
  stiffness: "N/m",
  avgPerformance: "%",
  performance: "%",
  time: "s",
  height: "cm",
  maxAvgHeightReached: "cm",
};

export const studyInfoLookup = {
  cmj: {
    name: "CMJ",
    description: "Salto en Movimiento",
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  squatJump: {
    name: "Squat Jump",
    description: "Salto de Sentadilla",
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  abalakov: {
    name: "Abalakov",
    description: "Salto en Movimiento",
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  multipleDropJump: {
    name: "Drop Jump",
    description: "Salto de Caída",
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  bosco: {
    name: "BOSCO Test",
    description: "Combinación de Tests",
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
  multipleJumps: {
    name: "Saltos Múltiples",
    description: "Saltos Repetidos Continuos",
    preview: {
      equipment: ["Alfombra de Contacto"],
    },
  },
} satisfies Record<keyof Studies, BaseStudy>;

const criterion1 = ["takeoffFoot", "load", "avgFlightTime", "avgHeightReached"];
const criterion2 = ["maxAvgHeightReached", "takeoffFoot"];

const criterion3 = [
  "takeoffFoot",
  "avgHeightReached",
  "avgPerformance",
  "avgStiffness",
  "performanceDrop",
];

const criterion4 = ["takeoffFoot", "avgFlightTime", "avgHeightReached"];

export const criterionLookup = {
  cmj: criterion1,
  squatJump: criterion1,
  abalakov: criterion1,
  multipleDropJump: criterion2,
  bosco: criterion4,
  multipleJumps: criterion3,
} satisfies Record<keyof Studies, string[]>;

export const validComparisons = {
  cmj: ["cmj", "squatJump", "abalakov"],
  squatJump: ["cmj", "squatJump", "abalakov"],
  abalakov: ["cmj", "squatJump", "abalakov"],
  multipleDropJump: ["multipleDropJump"],
  multipleJumps: ["multipleJumps"],
};

export default availableStudies;
