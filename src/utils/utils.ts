import { Event } from "../types/Events";
import {
  RangeEntry,
  VolumeReduction,
  EffortReduction,
  Progression,
  DisplayProgressionCollection,
  TrainingBlock,
  SelectedExercise,
  Session,
} from "../types/trainingPlan";

export function formatDateString(date: Date): string {
  return new Date(date)
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(
      /(\b|\s)([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]*)/g,
      (match, boundary, firstChar, rest, i) =>
        i > 0 && match.length > 3
          ? boundary + firstChar.toUpperCase() + rest
          : match
    )
    .replace(/,/g, "");
}

export function getTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function camelToNatural(camelCase: string): string {
  // Handle Spanish characters in addition to regular capitals
  const words = camelCase
    .replace(/([A-ZÁÉÍÓÚÑÜáéíóúñü])/g, " $1")
    .trim()
    // Don't lowercase parts that look like acronyms (including Spanish ones)
    .replace(/([A-ZÁÉÍÓÚÑÜ]{2,})/g, (match) => match)
    .split(" ");

  // Capitalize first letter of each word, preserve acronyms and Spanish characters
  return words
    .map((word) => {
      // Check if it's an acronym (including Spanish characters)
      if (word.match(/^[A-ZÁÉÍÓÚÑÜ]{2,}$/)) {
        return word; // Keep acronyms as is
      }

      // Special handling for Spanish lowercase first characters
      const firstChar = word.charAt(0);
      const rest = word.slice(1);

      // Map of lowercase to uppercase Spanish characters
      const spanishUppercase: { [key: string]: string } = {
        á: "Á",
        é: "É",
        í: "Í",
        ó: "Ó",
        ú: "Ú",
        ñ: "Ñ",
        ü: "Ü",
      };

      // Capitalize first character, handling Spanish special characters
      const upperFirst =
        spanishUppercase[firstChar.toLowerCase()] || firstChar.toUpperCase();

      return upperFirst + rest;
    })
    .join(" ");
}
export const naturalToCamelCase = (text: string): string => {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s_-]/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

export function getSecondsBetweenDates(date1, date2) {
  // Obtenemos la diferencia en milisegundos
  const diffInMs = date2.getTime() - date1.getTime();

  // Convertimos milisegundos a segundos (dividiendo por 1000)
  const diffInSeconds = diffInMs / 1000;

  return diffInSeconds;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export const getPerformanceDrop = (validPerformances: number[]) => {
  const sortedPerformances = [...validPerformances].sort((a, b) => b - a);

  const highestTwo = sortedPerformances.slice(0, 2);
  const lowestTwo = sortedPerformances.slice(-2);

  const avgHighest = (highestTwo[0] + highestTwo[1]) / 2;
  const avgLowest = (lowestTwo[0] + lowestTwo[1]) / 2;

  const decline = ((avgHighest - avgLowest) / avgHighest) * 100;
  return decline;
};

export function ftToCm(heightStr: string): number {
  const [feet, inches = "0"] = heightStr.split("'");
  const feetNum = parseInt(feet);
  const inchesNum = parseInt(inches);

  if (isNaN(feetNum) || isNaN(inchesNum)) {
    return 0;
  }

  // Convert feet to cm (1 foot = 30.48 cm)
  // Convert inches to cm (1 inch = 2.54 cm)
  const totalCm = Math.round(feetNum * 30.48 + inchesNum * 2.54);

  return totalCm;
}

export function formatMinutesToHoursAndMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function validateHHMM(value: string) {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(value);
}

/**
 * Creates a date with the correct local timezone
 * Prevents timezone offset issues when creating/updating events
 */
export const createLocalDate = (
  dateStr: string | Date,
  timeStr?: string
): Date => {
  const date = new Date(dateStr);

  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }

  // Create a date string in YYYY-MM-DD format
  const localDateStr = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Create a time string in HH:MM format
  const localTimeStr =
    timeStr ||
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;

  // Combine them to create a local datetime string with timezone offset
  const result = new Date(`${localDateStr}T${localTimeStr}:00`);

  // Add the timezone offset to compensate
  const timezoneOffset = result.getTimezoneOffset();
  result.setMinutes(result.getMinutes() + timezoneOffset);

  return result;
};

/**
 * Creates a date ISO string that preserves the exact time specified
 * Completely bypasses timezone issues by directly building the ISO string
 */
export const createTimezoneIndependentDate = (
  dateStr: string | Date,
  timeStr?: string
): string => {
  const date = new Date(dateStr);

  // Extract date parts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Extract time parts
  let hours, minutes;
  if (timeStr) {
    [hours, minutes] = timeStr.split(":").map((s) => s.padStart(2, "0"));
  } else {
    hours = String(date.getHours()).padStart(2, "0");
    minutes = String(date.getMinutes()).padStart(2, "0");
  }

  // Get the timezone offset in hours and minutes
  const tzOffset = -date.getTimezoneOffset();
  const tzOffsetHours = Math.floor(Math.abs(tzOffset) / 60);
  const tzOffsetMinutes = Math.abs(tzOffset) % 60;

  // Format the timezone string (e.g., +03:00, -05:30)
  const tzOffsetStr = `${tzOffset >= 0 ? "+" : "-"}${String(
    tzOffsetHours
  ).padStart(2, "0")}:${String(tzOffsetMinutes).padStart(2, "0")}`;

  // Build the ISO string with the explicit timezone offset
  return `${year}-${month}-${day}T${hours}:${minutes}:00${tzOffsetStr}`;
};

export const findOverlappingEvents = (
  events: Event[],
  newEvent: Event
): number | string | false => {
  const newEventStart = new Date(newEvent.date);
  const newEventDuration = newEvent.duration || 0; // Default to 0 if duration is missing
  const newEventEnd = new Date(
    newEventStart.getTime() + newEventDuration * 60000
  );
  const newEventDay = newEventStart.toDateString(); // Get YYYY-MM-DD for comparison

  for (const event of events) {
    // Skip comparing the event with itself if it's already in the list (e.g., during updates)
    if (event.id === newEvent.id) {
      continue;
    }

    const eventStart = new Date(event.date);

    // Check if the event is on the same day
    if (eventStart.toDateString() === newEventDay) {
      const eventDuration = event.duration || 0; // Default to 0 if duration is missing
      const eventEnd = new Date(eventStart.getTime() + eventDuration * 60000);

      // Check for overlap: (StartA < EndB) and (EndA > StartB)
      if (eventStart < newEventEnd && eventEnd > newEventStart) {
        return event.id; // Return the ID of the overlapping event
      }
    }
  }

  return false; // No overlap found
};

export function getReductionFromRangeEntries(
  type: "volume" | "effort",
  rangeEntries: RangeEntry[]
): VolumeReduction | EffortReduction {
  if (!rangeEntries) return null;
  const reductionObject: VolumeReduction | EffortReduction = { id: "" };

  rangeEntries.forEach((entry) => {
    const [min, max] = entry.range;
    const label = min === max ? `${min}` : `${min}-${max}`;

    reductionObject[label] = entry.percentageDrop;
  });

  return reductionObject;
}

export const validateReps = (
  input: string,
  seriesN: number | string
): { value: string; error: string } => {
  // Convert seriesN to number if it's a string
  const seriesNNum = Number(seriesN);

  // First check if it's a single positive integer
  if (/^[1-9]\d*$/.test(input)) {
    return { value: input, error: "" };
  }

  // For multiple series, check format
  if (seriesNNum <= 1) {
    return { value: "", error: "Solo se permite un número para una serie" };
  }

  // Check for mixed separators (reject things like "5-8/7")
  if (input.includes("-") && input.includes("/")) {
    return { value: "", error: "No se pueden mezclar separadores - y /" };
  }

  // Determine separator and trim input accordingly
  let trimmedInput = input;
  let separator: string | null = null;

  if (input.includes("-")) {
    separator = "-";
    // For hyphen separator, trim to only first 2 parts (e.g., "5-8-9" becomes "5-8")
    const parts = input.split("-");
    if (parts.length > 2) {
      trimmedInput = parts.slice(0, 2).join("-");
    }
  } else if (input.includes("/")) {
    separator = "/";
    // For slash separator, trim to match seriesN (e.g., "5/6/7" with seriesN=2 becomes "5/6")
    const parts = input.split("/");
    if (parts.length > seriesNNum) {
      trimmedInput = parts.slice(0, seriesNNum).join("/");
    }
  } else {
    return {
      value: "",
      error: "Formato inválido. Use números, rangos (5-8) o series (5/6/7)",
    };
  }

  // Split and validate each part of the trimmed input
  const parts = trimmedInput.split(separator);

  // For hyphen (-) separator, should have exactly 2 parts after trimming
  if (separator === "-" && parts.length !== 2) {
    return { value: "", error: "El formato de rango debe ser: número-número" };
  }

  // For slash (/) separator, should match seriesN after trimming
  if (separator === "/" && parts.length !== seriesNNum) {
    return {
      value: "",
      error: `Debe especificar ${seriesNNum} repeticiones separadas por /`,
    };
  }

  // Check each part is a valid positive number
  for (const part of parts) {
    const num = parseInt(part);
    if (isNaN(num) || num <= 0) {
      return {
        value: "",
        error: "Todos los números deben ser positivos y válidos",
      };
    }
  }

  console.log("trimmedInput", trimmedInput);
  console.log("seriesN", seriesNNum);

  return { value: trimmedInput, error: "" };
};

export const generateInitialProgression = (
  nOfWeeks: number,
  seriesN: number,
  repetitions: string,
  effort: number
) => {
  const progression: Progression[] = [];

  for (let i = 0; i < nOfWeeks; i++) {
    // Calculate progressive effort (increase by 5 each week)
    const currentEffort = Math.min(10, effort + i);

    // Handle progressive repetitions
    let currentReps = repetitions;
    if (repetitions.includes("-") || repetitions.includes("/")) {
      // Handle range format (e.g., "6-8" or "6/8")
      const separator = repetitions.includes("-") ? "-" : "/";
      const [start, end] = repetitions.split(separator).map(Number);
      const newStart = start + i * 2;
      const newEnd = end + i * 2;
      currentReps = `${newStart}${separator}${newEnd}`;
    } else {
      // Handle single number format
      const repNum = parseInt(repetitions);
      currentReps = (repNum + i * 2).toString();
    }

    progression.push({
      id: "",
      series: seriesN,
      repetitions: currentReps,
      effort: currentEffort,
    });
  }

  return progression;
};

export const formatProgression = (progression: Progression[]) => {
  return progression.map((p) => {
    return {
      id: p.id,
      series: p.series.toString(),
      repetitions: p.repetitions,
      effort: p.effort.toString(),
    };
  });
};

export const initializeDisplayProgressionCollection = (
  trainingBlock: TrainingBlock
) => {
  return trainingBlock.selectedExercises.reduce((acc, exercise) => {
    acc[exercise.id] = formatProgression(exercise.progression);
    return acc;
  }, {} as DisplayProgressionCollection);
};

export const initializeDisplayProgressionForSelectedExercise = (
  selectedExercise: SelectedExercise
) => {
  return formatProgression(selectedExercise.progression);
};

export function isSameWeek(date1: string, date2: string): boolean {
  // Parse dates as ISO strings to avoid timezone issues
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Get UTC date components to avoid timezone offset issues
  const startOfWeek1 = new Date(
    Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate())
  );
  const startOfWeek2 = new Date(
    Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate())
  );

  // Set both dates to the start of their respective weeks (Monday) in UTC
  startOfWeek1.setUTCDate(
    startOfWeek1.getUTCDate() - ((startOfWeek1.getUTCDay() + 6) % 7)
  );
  startOfWeek2.setUTCDate(
    startOfWeek2.getUTCDate() - ((startOfWeek2.getUTCDay() + 6) % 7)
  );

  // Compare the year and week number using UTC
  const year1 = startOfWeek1.getUTCFullYear();
  const year2 = startOfWeek2.getUTCFullYear();
  const week1 = getWeekNumberUTC(startOfWeek1);
  const week2 = getWeekNumberUTC(startOfWeek2);

  return year1 === year2 && week1 === week2;
}

// Helper function to get the week number using UTC to avoid timezone issues
function getWeekNumberUTC(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const days = Math.floor((date.valueOf() - start.valueOf()) / 86400000);
  return Math.ceil((days + start.getUTCDay() + 1) / 7);
}

export function formatIsoToSpanishDate(isoDate: string | Date): string {
  return new Date(isoDate)
    .toISOString()
    .split("T")[0]
    .split("-")
    .reverse()
    .slice(0, 2)
    .join("/");
}

export function countTotalExercises(session: Session): number {
  let count = 0;
  session.exercises.forEach((exercise) => {
    if (exercise.type === "trainingBlock") {
      count += exercise.selectedExercises.length;
    } else {
      count += 1;
    }
  });
  return count;
}

export function ratioToPercentage(ratio: string): number {
  const [firstNum, secondNum] = ratio.split("/");
  const firstNumNum = Number(firstNum);
  const secondNumNum = Number(secondNum);
  return (firstNumNum / secondNumNum) * 100;
}
