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
