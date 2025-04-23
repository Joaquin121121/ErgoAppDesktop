/**
 * Removes duplicate training solutions based on title
 * @param {Array<TrainingSolution>} solutions - Array of training solutions
 * @returns {Array<TrainingSolution>} Filtered array without duplicates
 */
export function removeDuplicateTrainingSolutions(solutions) {
  const uniqueTitles = new Set();
  return solutions.filter((solution) => {
    if (uniqueTitles.has(solution.title)) {
      return false;
    }
    uniqueTitles.add(solution.title);
    return true;
  });
}

// Define the TrainingSolution type if not globally available or imported
// For JSDoc environments:
/**
 * @typedef {import('../hooks/getTrainingSolutions').TrainingSolution} TrainingSolution
 */
