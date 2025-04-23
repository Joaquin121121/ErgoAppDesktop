import { useStudyContext } from "../contexts/StudyContext";
import { getTrainingSolutions } from "./getTrainingSolutions"; // Import the main function
import { removeDuplicateTrainingSolutions } from "../utils/trainingSolutionUtils"; // Import the utility function
import CompletedStudy from "../types/Studies"; // Assuming CompletedStudy type is exported from Studies.ts

/**
 * @typedef {import('./getTrainingSolutions').TrainingSolution} TrainingSolution
 */

export const getAllTrainingSolutions = () => {
  const { athlete } = useStudyContext();

  if (
    !athlete ||
    !athlete.completedStudies ||
    athlete.completedStudies.length === 0
  ) {
    return [];
  }

  const completedStudies = athlete.completedStudies;

  // Find the latest completed study for each type
  /** @type {Record<string, CompletedStudy>} */
  const latestStudiesByType = {};

  completedStudies.forEach((study) => {
    // Use results.type if studyInfo.type isn't reliable or consistently the specific type
    const studyType = study.results.type;
    // Ensure dates are comparable
    const studyDate = new Date(study.date);

    if (
      !latestStudiesByType[studyType] ||
      studyDate > new Date(latestStudiesByType[studyType].date)
    ) {
      latestStudiesByType[studyType] = study;
    }
  });

  // Generate all potential solutions from the latest studies
  /** @type {TrainingSolution[]} */
  let allSolutions = [];

  Object.values(latestStudiesByType).forEach((latestStudy) => {
    // Use results.type as the testType for getTrainingSolutions
    const solutionsForStudy = getTrainingSolutions(
      latestStudy.date,
      latestStudy.results.type
    );
    allSolutions = allSolutions.concat(solutionsForStudy);
  });

  // Remove duplicates based on title
  let uniqueSolutions = removeDuplicateTrainingSolutions(allSolutions);

  // Apply Bosco prioritization
  const hasBoscoCmjSj = uniqueSolutions.some(
    (s) => s.comparedTo === "bosco-cmj-squatjump"
  );
  const hasBoscoAbalakovCmj = uniqueSolutions.some(
    (s) => s.comparedTo === "bosco-abalakov-cmj"
  );

  uniqueSolutions = uniqueSolutions.filter((solution) => {
    // Remove standalone CMJ-SJ if Bosco CMJ-SJ exists
    if (hasBoscoCmjSj && solution.comparedTo === "cmj-squatjump") {
      return false;
    }
    // Remove standalone Abalakov-CMJ if Bosco Abalakov-CMJ exists
    if (hasBoscoAbalakovCmj && solution.comparedTo === "abalakov-cmj") {
      return false;
    }
    // Keep all other solutions
    return true;
  });

  return uniqueSolutions;
};
