/**
 * Filters training solutions to only include those relevant to a specific test type
 * @param {Array<TrainingSolution>} solutions - Array of training solutions
 * @param {string} testType - The test type to filter for
 * @returns {Array<TrainingSolution>} Filtered array of relevant solutions
 */
function filterRelevantSolutions(solutions, testType) {
  return solutions.filter((solution) => {
    const comparisonType = solution.comparedTo;

    // For specific test types, only show relevant comparisons
    switch (testType) {
      case "cmj":
        // For CMJ, show comparisons with SquatJump, Abalakov, MultipleDropJump,
        // and BOSCO comparisons involving CMJ
        return (
          comparisonType === "cmj-squatjump" ||
          comparisonType === "abalakov-cmj" ||
          comparisonType === "multipledropjump-cmj" ||
          comparisonType === "bosco-cmj-squatjump" ||
          comparisonType === "bosco-abalakov-cmj"
        );

      case "squatJump":
        // For Squat Jump, show comparisons with CMJ and BOSCO comparisons involving SquatJump
        return (
          comparisonType === "cmj-squatjump" ||
          comparisonType === "bosco-cmj-squatjump"
        );

      case "abalakov":
        // For Abalakov, show only comparisons with CMJ
        return (
          comparisonType === "abalakov-cmj" ||
          comparisonType === "bosco-abalakov-cmj"
        );

      case "multipleDropJump":
        // For MultipleDropJump, show only comparisons with CMJ
        return comparisonType === "multipledropjump-cmj";

      case "multipleJumps":
        // For MultipleJumps, show only RSI-based solutions
        return comparisonType === "multiplejumps";

      case "bosco":
        // For BOSCO, show all BOSCO-related comparisons
        return comparisonType.startsWith("bosco-");

      default:
        // For other test types, show all comparisons
        return true;
    }
  });
}

// Training Solutions Generator
import { useStudyContext } from "../contexts/StudyContext";
import { removeDuplicateTrainingSolutions } from "../utils/trainingSolutionUtils";

/**
 * @typedef {Object} TrainingSolution
 * @property {string} title - Title of the training solution
 * @property {string} info - Explanation of why this training is recommended
 * @property {string} exerciseType - Type of exercises recommended
 * @property {string[]} exerciseExamples - Examples of specific exercises
 * @property {string} comparedTo - The type of study comparison that generated this solution (e.g., "cmj-squatjump")
 */

/**
 * @typedef {Object} Study
 * @property {string} date - Date of the study (ISO string or similar)
 * @property {Object} results - Results object containing test type and metrics
 * @property {string} results.type - Type of the test (e.g., "cmj", "squatJump", "bosco")
 * // ... other potential results properties
 */

/**
 * @typedef {Object.<string, Study|null>} LatestStudies
 * @property {Study|null} cmj - Latest CMJ study (standalone or from Bosco)
 * @property {Study|null} squatJump - Latest Squat Jump study (standalone or from Bosco)
 * @property {Study|null} abalakov - Latest Abalakov study (standalone or from Bosco)
 * @property {Study|null} multipleDropJump - Latest Multiple Drop Jump study
 * @property {Study|null} multipleJumps - Latest Multiple Jumps study
 * @property {Study|null} bosco - Latest Bosco study
 */

/**
 * Finds the latest completed study for each relevant test type.
 * For CMJ, SquatJump, and Abalakov, it considers both standalone tests
 * and tests nested within a Bosco test, selecting the most recent.
 * @param {Array<Study>} completedStudies - Array of all completed studies for the athlete.
 * @returns {LatestStudies} An object containing the latest study for each type, or null if none exists.
 */
function findLatestStudies(completedStudies) {
  /** @type {LatestStudies} */
  const latestStudies = {
    cmj: null,
    squatJump: null,
    abalakov: null,
    multipleDropJump: null,
    multipleJumps: null,
    bosco: null,
  };

  if (!completedStudies || completedStudies.length === 0) {
    return latestStudies;
  }

  // Sort studies by date descending to easily find the latest
  const sortedStudies = [...completedStudies].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Helper to update latest study if the current one is newer
  const updateLatest = (type, study) => {
    const currentLatest = latestStudies[type];
    if (!currentLatest || new Date(study.date) > new Date(currentLatest.date)) {
      latestStudies[type] = study;
    }
  };

  // Iterate through sorted studies to find the latest of each type
  sortedStudies.forEach((study) => {
    const studyType = study.results.type;
    const studyDate = new Date(study.date);

    switch (studyType) {
      case "cmj":
        updateLatest("cmj", study);
        break;
      case "squatJump":
        updateLatest("squatJump", study);
        break;
      case "abalakov":
        updateLatest("abalakov", study);
        break;
      case "multipleDropJump":
        updateLatest("multipleDropJump", study);
        break;
      case "multipleJumps":
        updateLatest("multipleJumps", study);
        break;
      case "bosco":
        updateLatest("bosco", study);
        // Also consider the nested tests within Bosco
        // Create pseudo-study objects for comparison purposes
        if (study.results.cmj) {
          updateLatest("cmj", {
            ...study,
            results: { ...study.results.cmj, type: "cmj" },
          }); // Keep original date
        }
        if (study.results.squatJump) {
          updateLatest("squatJump", {
            ...study,
            results: { ...study.results.squatJump, type: "squatJump" },
          }); // Keep original date
        }
        if (study.results.abalakov) {
          updateLatest("abalakov", {
            ...study,
            results: { ...study.results.abalakov, type: "abalakov" },
          }); // Keep original date
        }
        break;
      default:
        // Ignore unknown study types
        break;
    }
  });

  return latestStudies;
}

/**
 * Generates training solutions for a specific test performed on a target date.
 * It compares the target test with the latest relevant comparison tests.
 * @param {Date|string} targetDate - The date of the specific test to analyze.
 * @returns {Array<TrainingSolution>} Array of training solution recommendations for the target test.
 */
export function getTrainingSolutionsForTest(targetDate) {
  const { athlete } = useStudyContext();
  const trainingSolutions = [];

  if (
    !athlete ||
    !athlete.completedStudies ||
    athlete.completedStudies.length === 0
  ) {
    return [];
  }

  // Convert target date to string for consistent comparison
  const targetDateStr = new Date(targetDate).toDateString();

  // Find the specific study performed on the target date
  const targetStudy = athlete.completedStudies.find(
    (study) => new Date(study.date).toDateString() === targetDateStr
  );

  // If no study found for the target date, return empty array
  if (!targetStudy) {
    console.warn(`No study found for date: ${targetDateStr}`);
    return [];
  }

  // Find the latest studies of all relevant types *excluding* the target study date temporarily
  // to avoid comparing a test to itself if it's the absolute latest.
  const otherStudies = athlete.completedStudies.filter(
    (study) => new Date(study.date).toDateString() !== targetDateStr
  );
  const latestComparisonStudies = findLatestStudies(otherStudies);

  // --- Perform Comparisons based on Target Study Type ---
  const results = targetStudy.results;
  const studyType = results.type;

  // Compare Bosco Test components
  if (studyType === "bosco") {
    // Compare CMJ and Squat Jump within BOSCO
    if (results.cmj?.avgHeightReached && results.squatJump?.avgHeightReached) {
      const ecrValue = calculateECR(
        results.cmj.avgHeightReached,
        results.squatJump.avgHeightReached
      );
      addECRTrainingSolutions(
        ecrValue,
        trainingSolutions,
        "bosco-cmj-squatjump"
      );
    }

    // Compare Abalakov and CMJ within BOSCO
    if (results.abalakov?.avgHeightReached && results.cmj?.avgHeightReached) {
      const armSwingContribution = calculateArmSwingContribution(
        results.abalakov.avgHeightReached,
        results.cmj.avgHeightReached
      );
      addArmSwingTrainingSolutions(
        armSwingContribution,
        trainingSolutions,
        "bosco-abalakov-cmj"
      );
    }
    // Potentially compare Bosco Drop Jump with Bosco CMJ if data exists
    // Add comparison if needed based on Bosco structure
  }
  // Compare standalone CMJ Test
  else if (studyType === "cmj") {
    // Compare with latest Squat Jump (standalone or from Bosco)
    if (latestComparisonStudies.squatJump) {
      const sjResult = latestComparisonStudies.squatJump.results;
      const ecrValue = calculateECR(
        results.avgHeightReached,
        sjResult.avgHeightReached
      );
      addECRTrainingSolutions(ecrValue, trainingSolutions, "cmj-squatjump");
    }

    // Compare with latest Abalakov (standalone or from Bosco)
    if (latestComparisonStudies.abalakov) {
      const abalakovResult = latestComparisonStudies.abalakov.results;
      const armSwingContribution = calculateArmSwingContribution(
        abalakovResult.avgHeightReached,
        results.avgHeightReached
      );
      addArmSwingTrainingSolutions(
        armSwingContribution,
        trainingSolutions,
        "abalakov-cmj"
      );
    }

    // Compare with latest MultipleDropJump
    if (latestComparisonStudies.multipleDropJump) {
      const mdjResult = latestComparisonStudies.multipleDropJump.results;
      compareDropJumpWithCMJ(
        mdjResult,
        results, // CMJ results
        trainingSolutions,
        "multipledropjump-cmj"
      );
    }
  }
  // Compare standalone Squat Jump Test
  else if (studyType === "squatJump") {
    // Compare with latest CMJ (standalone or from Bosco)
    if (latestComparisonStudies.cmj) {
      const cmjResult = latestComparisonStudies.cmj.results;
      const ecrValue = calculateECR(
        cmjResult.avgHeightReached,
        results.avgHeightReached // SJ results
      );
      addECRTrainingSolutions(ecrValue, trainingSolutions, "cmj-squatjump");
    }
  }
  // Compare standalone Abalakov Test
  else if (studyType === "abalakov") {
    // Compare with latest CMJ (standalone or from Bosco)
    if (latestComparisonStudies.cmj) {
      const cmjResult = latestComparisonStudies.cmj.results;
      const armSwingContribution = calculateArmSwingContribution(
        results.avgHeightReached, // Abalakov results
        cmjResult.avgHeightReached
      );
      addArmSwingTrainingSolutions(
        armSwingContribution,
        trainingSolutions,
        "abalakov-cmj"
      );
    }
  }
  // Compare standalone MultipleDropJump Test
  else if (studyType === "multipleDropJump") {
    // Compare with latest CMJ (standalone or from Bosco)
    if (latestComparisonStudies.cmj) {
      const cmjResult = latestComparisonStudies.cmj.results;
      compareDropJumpWithCMJ(
        results, // MDJ results
        cmjResult,
        trainingSolutions,
        "multipledropjump-cmj"
      );
    }
  }
  // Process MultipleJumps Test for RSI
  else if (studyType === "multipleJumps") {
    calculateRSIFromMultipleJumps(
      results,
      trainingSolutions,
      "multiplejumps" // Comparison type is just the test itself
    );
  }

  // No need to filter by testType here, as this function is already specific
  // No need to remove duplicates here, handled by getAllTrainingSolutions if needed
  return trainingSolutions;
}

/**
 * Generates a comprehensive list of all possible training solutions
 * by analyzing the latest instance of each test type and its comparisons.
 * @returns {Array<TrainingSolution>} A deduplicated array of all training solution recommendations.
 */
export function getAllTrainingSolutions() {
  const { athlete } = useStudyContext();
  let allSolutions = [];

  if (
    !athlete ||
    !athlete.completedStudies ||
    athlete.completedStudies.length === 0
  ) {
    return [];
  }

  // Find the latest study date for *every* relevant type
  const latestStudiesOfAllTypes = findLatestStudies(athlete.completedStudies);

  // Collect unique dates of the latest studies
  const latestStudyDates = new Set();
  Object.values(latestStudiesOfAllTypes).forEach((study) => {
    if (study) {
      latestStudyDates.add(new Date(study.date).toDateString()); // Use DateString for comparison
    }
  });

  // Generate solutions for each unique latest study date
  latestStudyDates.forEach((dateStr) => {
    // We need the original Date object or string format expected by getTrainingSolutionsForTest
    // Find the original study corresponding to this date string to pass the correct date format
    const originalStudy = athlete.completedStudies.find(
      (s) => new Date(s.date).toDateString() === dateStr
    );
    if (originalStudy) {
      const solutionsForDate = getTrainingSolutionsForTest(originalStudy.date);
      allSolutions.push(...solutionsForDate);
    }
  });

  // Remove duplicate solutions from the combined list
  const uniqueSolutions = removeDuplicateTrainingSolutions(allSolutions);

  return uniqueSolutions;
}

/**
 * Compare Drop Jump with CMJ and add appropriate training solutions
 * @param {Object} dropJumpResult - Drop Jump result (can be from MultipleDropJump or Bosco)
 * @param {Object} cmjResult - CMJ result (can be standalone or from Bosco)
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} comparisonType - Identifier for the comparison type
 */
function compareDropJumpWithCMJ(
  dropJumpResult,
  cmjResult,
  trainingSolutions,
  comparisonType
) {
  // Find the highest average height reached across all drop jumps
  let maxDropJumpHeight = 0;
  // Handle results from MultipleDropJump (array)
  if (dropJumpResult.dropJumps && dropJumpResult.dropJumps.length > 0) {
    dropJumpResult.dropJumps.forEach((dropJump) => {
      // Check if avgHeightReached exists and is a number
      if (
        typeof dropJump.avgHeightReached === "number" &&
        dropJump.avgHeightReached > maxDropJumpHeight
      ) {
        maxDropJumpHeight = dropJump.avgHeightReached;
      }
    });
  }
  // Handle potential direct property if available (e.g., from Bosco or simplified structure)
  else if (typeof dropJumpResult.maxAvgHeightReached === "number") {
    maxDropJumpHeight = dropJumpResult.maxAvgHeightReached;
  }
  // Add a check for avgHeightReached directly on dropJumpResult if it's not an array structure
  else if (typeof dropJumpResult.avgHeightReached === "number") {
    maxDropJumpHeight = dropJumpResult.avgHeightReached; // Consider single DJ value if present
  }

  // Only calculate if we have valid heights
  if (maxDropJumpHeight > 0 && cmjResult?.avgHeightReached > 0) {
    // Check if Drop Jump height is greater than CMJ height
    if (maxDropJumpHeight > cmjResult.avgHeightReached) {
      trainingSolutions.push({
        title: "Entrenar con drop jump",
        info: "El sujeto no puede elevar el centro de gravedad con su salto hasta la altura de caída óptima de drop jump",
        exerciseType: "Drop jump",
        exerciseExamples: [
          "Se sugiere entrenar drop jump con altura de caída óptima en base al mejor índice Q",
        ],
        comparedTo: comparisonType,
      });
    } else {
      trainingSolutions.push({
        title: "Entrenar con vallas",
        info: "El sujeto genera el mejor índice de calidad de salto a una altura a la que puede lograr saltar por sus propios medios",
        exerciseType: "Saltos con vallas",
        exerciseExamples: [
          "Se sugiere entrenar colocando obstáculos a la altura del mejor índice Q",
        ],
        comparedTo: comparisonType,
      });
    }
  }
}

/**
 * Calculate RSI from MultipleJumps test and add appropriate training solutions
 * @param {Object} results - MultipleJumps results
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} comparisonType - Type of test that generated the results (e.g., "multiplejumps")
 */
function calculateRSIFromMultipleJumps(
  results,
  trainingSolutions,
  comparisonType
) {
  let rsi = null;

  // Try different methods to calculate RSI based on available data

  // Method 1: Using times array to find max flight time and corresponding floor time
  if (
    results.times &&
    Array.isArray(results.times) &&
    results.times.length > 0
  ) {
    let maxFlightTime = 0;
    let maxFlightTimeIndex = -1; // Initialize to invalid index

    results.times.forEach((time, index) => {
      if (
        time &&
        typeof time.flightTime === "number" &&
        time.flightTime > maxFlightTime
      ) {
        maxFlightTime = time.flightTime;
        maxFlightTimeIndex = index;
      }
    });

    // Ensure index is valid and corresponding floor time exists and is valid
    if (maxFlightTimeIndex !== -1) {
      const correspondingTime = results.times[maxFlightTimeIndex];
      if (
        correspondingTime &&
        typeof correspondingTime.floorTime === "number" &&
        correspondingTime.floorTime > 0 &&
        maxFlightTime > 0
      ) {
        rsi = maxFlightTime / correspondingTime.floorTime;
      }
    }
  }

  // Method 2: Using average flight time and floor time
  if (
    rsi === null &&
    typeof results.avgFlightTime === "number" &&
    results.avgFlightTime > 0 &&
    typeof results.avgFloorTime === "number" &&
    results.avgFloorTime > 0
  ) {
    rsi = results.avgFlightTime / results.avgFloorTime;
  }

  // Method 3: Using stiffness and performance metrics as a proxy
  // Note: This proxy might be inaccurate and should be validated or replaced with a better model if possible.
  if (
    rsi === null &&
    typeof results.avgStiffness === "number" &&
    results.avgStiffness > 0 &&
    typeof results.avgPerformance === "number" &&
    results.avgPerformance > 0
  ) {
    rsi = 2.0; // Defaulting to a moderate RSI value as a placeholder
  }

  // Method 4: Default fallback if no RSI could be calculated
  if (rsi === null) {
    // Using a default value allows providing generic advice but might not be ideal.
    // Consider logging a warning or handling this case differently if defaults are problematic.
    console.warn(
      "Could not calculate RSI from MultipleJumps data. Using default value 2.0."
    );
    rsi = 2.0;
  }

  // Now that we have an RSI value (calculated or default), add the appropriate training solutions
  addRSITrainingSolutions(rsi, trainingSolutions, comparisonType); // Use comparisonType
}

/**
 * Calculates Elastic Contribution Ratio (ECR)
 * @param {number | undefined | null} cmjHeight - CMJ height in cm
 * @param {number | undefined | null} sjHeight - Squat Jump height in cm
 * @returns {number} ECR as a percentage, or 0 if inputs are invalid.
 */
function calculateECR(cmjHeight, sjHeight) {
  // Add checks for null/undefined and ensure sjHeight is not zero
  if (
    typeof cmjHeight !== "number" ||
    typeof sjHeight !== "number" ||
    sjHeight === 0
  ) {
    return 0;
  }
  return ((cmjHeight - sjHeight) / sjHeight) * 100;
}

/**
 * Calculates arm swing contribution
 * @param {number | undefined | null} abalakovHeight - Abalakov height in cm
 * @param {number | undefined | null} cmjHeight - CMJ height in cm
 * @returns {number} Arm swing contribution as a percentage, or 0 if inputs are invalid.
 */
function calculateArmSwingContribution(abalakovHeight, cmjHeight) {
  // Add checks for null/undefined and ensure cmjHeight is not zero
  if (
    typeof abalakovHeight !== "number" ||
    typeof cmjHeight !== "number" ||
    cmjHeight === 0
  ) {
    return 0;
  }
  return ((abalakovHeight - cmjHeight) / cmjHeight) * 100;
}

/**
 * Adds training solutions based on ECR value
 * @param {number} ecrValue - ECR value
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} comparisonType - Type of comparison that generated the ECR value (e.g., "cmj-squatjump")
 */
function addECRTrainingSolutions(ecrValue, trainingSolutions, comparisonType) {
  // ECR < 10%
  if (ecrValue < 10) {
    trainingSolutions.push({
      title: "Énfasis en componente elástico",
      info: "El tejido conectivo tiene poca capacidad de acumular energía elástica",
      exerciseType:
        "Ejercicios con la fase excéntrica acentuada, ejercicios isométricos en amplios ángulos articulares o ejercicios excéntricos cuasi-isométricos",
      exerciseExamples: [
        "Sentadillas con descenso controlado",
        "Sentadilla supramáxima excéntrica a una pierna",
        "Peso muerto con fase excéntrica controlada",
      ],
      comparedTo: comparisonType,
    });
  }
  // ECR between 10% and 20%
  else if (ecrValue >= 10 && ecrValue < 20) {
    trainingSolutions.push({
      title: "Énfasis en ambas componentes",
      info: "Ambos componentes de la musculatura deben ser desarrollados en la misma magnitud.",
      exerciseType:
        "Se recomiendan ejercicios que estimulen el componente contráctil y el componente elástico equilibradamente como ejercicios isométricos, ejercicios solo concéntricos, ejercicios con pausas intrarepetición",
      exerciseExamples: [
        "Sentadilla isométrica a dos piernas",
        "Salto con sobrecarga",
        "Estocada con paso al frente",
      ],
      comparedTo: comparisonType,
    });
  }
  // ECR > 20%
  else if (ecrValue >= 20) {
    trainingSolutions.push({
      title: "Énfasis en componente contráctil",
      info: "El sujeto tiene gran capacidad de acumular energía elástica. Tiene buena calidad y cantidad de tejido conectivo principalmente en paralelo y también en serie",
      exerciseType:
        "Se recomiendan ejercicios de saltabilidad sin fase de vuelo previa, ejercicios tradicionales con fase excéntrica acentuada, ejercicios isométricos en amplios ángulos articulares",
      exerciseExamples: [
        "Sentadillas con acentuación excéntrica",
        "Salto con contramovimiento sin descenso previo",
        "Isometría en prensa 45°",
      ],
      comparedTo: comparisonType,
    });
  }
}

/**
 * Adds training solutions based on arm swing contribution
 * @param {number} armSwingValue - Arm swing contribution percentage
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} comparisonType - Type of comparison that generated the value (e.g., "abalakov-cmj")
 */
function addArmSwingTrainingSolutions(
  armSwingValue,
  trainingSolutions,
  comparisonType
) {
  // Arm swing <= 10% (Assuming 10% is the threshold)
  // Consider if the expected range (10-15% mentioned in info) implies a different threshold or range.
  if (armSwingValue <= 10) {
    trainingSolutions.push({
      title: "Bajo nivel de coordinación de brazos",
      info: "La inercia que generan los brazos no impulsa el salto vertical. La diferencia de altura esperada es de 10-15%",
      exerciseType: "Ejercicios de coordinación de brazos",
      exerciseExamples: [
        "Saltos con ayuda de brazos con y sin sobrecarga externa ligera en brazos",
        "Saltos al cajón con ayuda de brazos",
        "Saltos a la torre con ayuda de brazos",
        "Saltos verticales consecutivos con ayuda de brazos",
      ],
      comparedTo: comparisonType,
    });
  }
  // Add 'else if' or 'else' blocks here if there are recommendations for higher arm swing values.
}

/**
 * Adds training solutions based on RSI value
 * @param {number} rsiValue - Reactive Strength Index value
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} comparisonType - Type of test/comparison that generated the RSI value (e.g., "multiplejumps")
 */
function addRSITrainingSolutions(rsiValue, trainingSolutions, comparisonType) {
  // RSI < 1
  if (rsiValue < 1) {
    trainingSolutions.push({
      title: "Muy bajo índice de fuerza reactiva (<1)",
      info: "Capacidad de fuerza reactiva limitada, priorizar desarrollo de fuerza",
      exerciseType:
        "Se recomiendan ejercicios básicos priorizando la intensidad del ejercicio.",
      exerciseExamples: [
        "Sentadillas con pocas repeticiones y alta intensidad",
        "Prensa a 45 grados con pocas repeticiones y alta densidad",
        "Ejercicios coordinativos en escalerilla sin fase de vuelo",
      ],
      comparedTo: comparisonType, // Use comparisonType
    });
  }
  // RSI 1-1.5
  else if (rsiValue >= 1 && rsiValue < 1.5) {
    trainingSolutions.push({
      title: "Bajo índice de fuerza reactiva (1 - 1.5)",
      info: "Capacidad de fuerza reactiva limitada, priorizar desarrollo de fuerza",
      exerciseType:
        "Comenzar con saltabilidad tipo HOPS con mínima fase de vuelo",
      exerciseExamples: [
        "HOPS de intensidad moderada/baja con tiempos de contacto moderados",
        "Sentadillas con pocas repeticiones y alta intensidad",
        "Prensa a 45 grados con pocas repeticiones y alta densidad",
      ],
      comparedTo: comparisonType, // Use comparisonType
    });
  }
  // RSI 1.5-2
  else if (rsiValue >= 1.5 && rsiValue < 2) {
    trainingSolutions.push({
      title: "Moderado índice de fuerza reactiva (1.5 - 2)",
      info: "Moderada capacidad de acumulación de energía elástica principalmente en tendones",
      exerciseType:
        "Ejercicios de saltabilidad de intensidad moderada/alta con mínima flexión de tobillos y rodillas",
      exerciseExamples: [
        "Ejercicios de saltabilidad tipo HOPS con fase de vuelo de intensidad moderada/alta con tiempo de contacto bajo",
        "Ejercicios de saltabilidad tipo HOPS unilateral",
        "Saltar la soga con los tobillos y rodillas lo más rígido posible y con el menor tiempo de contacto",
      ],
      comparedTo: comparisonType, // Use comparisonType
    });
  }
  // RSI 2-2.5
  else if (rsiValue >= 2 && rsiValue < 2.5) {
    trainingSolutions.push({
      title: "Buen índice de fuerza reactiva (2 - 2.5)",
      info: "Moderada/buena capacidad de fuerza reactiva",
      exerciseType:
        "Se recomienda saltabilidad con fase de vuelo de moderada/alta intensidad",
      exerciseExamples: [
        "Saltos con vallas",
        "Saltos rebote en el lugar de alta intensidad",
        "Saltos con mínima asistencia",
      ],
      comparedTo: comparisonType, // Use comparisonType
    });
  }
  // RSI 2.5-3
  else if (rsiValue >= 2.5 && rsiValue < 3) {
    trainingSolutions.push({
      title: "Alto nivel de fuerza reactiva (2.5 - 3)",
      info: "Altos niveles de acumulación de energía elástica, buenos niveles de stiffness",
      exerciseType:
        "Se recomiendan ejercicios de saltabilidad de muy alta intensidad",
      exerciseExamples: [
        "Drop jumps",
        "Pliometría (shock method)",
        "Saltos con vallas con máxima intensidad y mínimo tiempo de contacto",
      ],
      comparedTo: comparisonType, // Use comparisonType
    });
  }
  // RSI > 3
  else if (rsiValue >= 3) {
    trainingSolutions.push({
      title: "Nivel de fuerza reactiva clase mundial (>3)",
      info: "Muy altos niveles de fuerza reactiva, capacidad limitada para mejorar la fuerza reactiva",
      exerciseType:
        "Se recomiendan ejercicios de saltabilidad de muy alta intensidad",
      exerciseExamples: [
        "Pliometría de alto nivel",
        "Drop jumps sobre superficies rígidas",
        "Saltabilidad con mínima fase de contacto sobre superficies rígidas",
      ],
      comparedTo: comparisonType, // Use comparisonType
    });
  }
}
