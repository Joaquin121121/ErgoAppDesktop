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
