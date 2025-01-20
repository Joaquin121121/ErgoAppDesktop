export interface Athlete {
  name: string;
  birthDate: Date;
  country: string;
  state: string;
  gender: "male" | "female" | "other";
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

  const athlete = value as any;

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
  if (!["male", "female", "other"].includes(athlete.gender)) {
    return false;
  }

  // Check heightUnit
  if (!["cm", "ft"].includes(athlete.heightUnit)) {
    return false;
  }

  // Check weightUnit
  if (!["kgs", "lbs"].includes(athlete.weightUnit)) {
    return false;
  }

  return true;
}

export function transformToAthlete(data: any): Athlete | null {
  try {
    const athlete: Athlete = {
      name: String(data.name || ""),
      birthDate: new Date(data.birthDate),
      country: String(data.country || ""),
      state: String(data.state || ""),
      gender: data.gender as "male" | "female" | "other",
      height: String(data.height || ""),
      heightUnit: data.heightUnit as "cm" | "ft",
      weight: String(data.weight || 0),
      weightUnit: data.weightUnit as "kgs" | "lbs",
      discipline: String(data.discipline || ""),
      category: String(data.category || ""),
      institution: String(data.institution || ""),
      comments: String(data.comments || ""),
    };

    return isAthlete(athlete) ? athlete : null;
  } catch (error) {
    console.error("Error transforming athlete data:", error);
    return null;
  }
}
