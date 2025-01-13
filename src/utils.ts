export function camelToEnglish(camelCase: string): string {
  // Add space before capital letters and split into words
  const words = camelCase
    .replace(/([A-Z])/g, " $1")
    .trim()
    // Don't lowercase parts that look like acronyms
    .replace(/([A-Z]{2,})/g, (match) => match)
    .split(" ");

  // Capitalize first letter of each word, preserve acronyms
  return words
    .map((word) =>
      word.match(/^[A-Z]{2,}$/)
        ? word // Keep acronyms as is
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}
