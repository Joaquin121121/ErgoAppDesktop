export interface Athlete {
  name: string;
  birthDate: Date;
  country: string;
  state: string;
  gender: "M" | "F" | "O" | "";
  height: string;
  heightUnit: "cm" | "ft";
  weight: string;
  weightUnit: "kgs" | "lbs";
  discipline: string;
  category: string;
  institution: string;
  comments: string;
}

export function isAthlete(value: unknown): value is Athlete {
  if (!value || typeof value !== "object") {
    return false;
  }

  const athlete = value as Record<string, unknown>;

  // Check required string fields
  const stringFields: (keyof Athlete)[] = [
    "name",
    "country",
    "state",
    "height",
    "weight",
    "discipline",
    "category",
    "institution",
    "comments",
  ];

  if (!stringFields.every((field) => typeof athlete[field] === "string")) {
    return false;
  }

  // Check birthDate
  if (
    !(athlete.birthDate instanceof Date) ||
    isNaN(athlete.birthDate.getTime())
  ) {
    return false;
  }

  // Check gender
  if (!["M", "F", "O", ""].includes(athlete.gender as string)) {
    return false;
  }

  // Check heightUnit
  if (!["cm", "ft"].includes(athlete.heightUnit as string)) {
    return false;
  }

  // Check weightUnit
  if (!["kgs", "lbs"].includes(athlete.weightUnit as string)) {
    return false;
  }

  return true;
}

export function transformToAthlete(data: unknown): Athlete | null {
  try {
    if (!data || typeof data !== "object") {
      return null;
    }

    const input = data as Record<string, unknown>;

    // Handle birthDate with proper type checking
    let birthDate: Date;
    if (input.birthDate instanceof Date) {
      birthDate = input.birthDate;
    } else if (
      typeof input.birthDate === "string" ||
      typeof input.birthDate === "number"
    ) {
      birthDate = new Date(input.birthDate);
    } else {
      birthDate = new Date(); // Default to current date if invalid
    }

    if (isNaN(birthDate.getTime())) {
      birthDate = new Date(); // Fallback to current date if parsing failed
    }

    // Transform gender to match the union type
    let gender: "M" | "F" | "O" | "" = "";
    if (typeof input.gender === "string") {
      if (["M", "F", "O", ""].includes(input.gender)) {
        gender = input.gender as "M" | "F" | "O" | "";
      }
    }

    // Transform height and weight units with proper type checking
    const heightUnit =
      typeof input.heightUnit === "string" &&
      ["cm", "ft"].includes(input.heightUnit)
        ? (input.heightUnit as "cm" | "ft")
        : "cm"; // Default to cm if invalid

    const weightUnit =
      typeof input.weightUnit === "string" &&
      ["kgs", "lbs"].includes(input.weightUnit)
        ? (input.weightUnit as "kgs" | "lbs")
        : "kgs"; // Default to kgs if invalid

    const athlete: Athlete = {
      name: String(input.name || ""),
      birthDate,
      country: String(input.country || ""),
      state: String(input.state || ""),
      gender,
      height: String(input.height || ""),
      heightUnit,
      weight: String(input.weight || ""),
      weightUnit,
      discipline: String(input.discipline || ""),
      category: String(input.category || ""),
      institution: String(input.institution || ""),
      comments: String(input.comments || ""),
    };

    return isAthlete(athlete) ? athlete : null;
  } catch (error) {
    console.error("Error transforming athlete data:", error);
    return null;
  }
}
