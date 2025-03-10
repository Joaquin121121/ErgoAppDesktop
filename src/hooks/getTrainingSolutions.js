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
} // Training Solutions Generator
import { useStudyContext } from "../contexts/StudyContext";

/**
 * Returns training solutions based on analysis of jump test comparisons
 * @param {Date|string} targetDate - Date to find the completed study
 * @param {string} [testType] - Optional test type to filter solutions for
 * @returns {Array<TrainingSolution>} Array of training solution recommendations
 */
export function getTrainingSolutions(targetDate, testType) {
  // Get athlete from context
  const { athlete } = useStudyContext();
  const trainingSolutions = [];

  if (
    !athlete ||
    !athlete.completedStudies ||
    athlete.completedStudies.length === 0
  ) {
    return [];
  }

  // Convert target date to string for comparison
  const targetDateStr = new Date(targetDate).toDateString();

  // Find studies matching the target date
  const targetStudies = athlete.completedStudies.filter(
    (study) => new Date(study.date).toDateString() === targetDateStr
  );

  if (targetStudies.length === 0) return [];

  // Get all studies except those on the target date, to find the latest for each type
  const otherStudies = athlete.completedStudies.filter(
    (study) => new Date(study.date).toDateString() !== targetDateStr
  );

  // For studies not on target date, find the latest study of each type
  const latestStudiesByType = {};

  otherStudies.forEach((study) => {
    const studyType = study.results.type;
    const studyDate = new Date(study.date);

    // If we don't have this type yet, or this study is more recent, update
    if (
      !latestStudiesByType[studyType] ||
      studyDate > new Date(latestStudiesByType[studyType].date)
    ) {
      latestStudiesByType[studyType] = study;
    }
  });

  // Process each study on the target date
  targetStudies.forEach((study) => {
    const results = study.results;
    const studyType = results.type;

    // Check if it's a BOSCO test (contains cmj, squatJump, and abalakov)
    if (studyType === "bosco") {
      // Compare CMJ and Squat Jump within BOSCO
      const ecrValue = calculateECR(
        results.cmj.avgHeightReached,
        results.squatJump.avgHeightReached
      );
      addECRTrainingSolutions(
        ecrValue,
        trainingSolutions,
        "bosco-cmj-squatjump"
      );

      // Compare Abalakov and CMJ within BOSCO
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
    // Process CMJ test
    else if (studyType === "cmj") {
      // Compare with latest Squat Jump
      if (latestStudiesByType["squatJump"]) {
        const sjResult = latestStudiesByType["squatJump"].results;
        const ecrValue = calculateECR(
          results.avgHeightReached,
          sjResult.avgHeightReached
        );
        addECRTrainingSolutions(ecrValue, trainingSolutions, "cmj-squatjump");
      }

      // Compare with latest Abalakov
      if (latestStudiesByType["abalakov"]) {
        const abalakovResult = latestStudiesByType["abalakov"].results;
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
      if (latestStudiesByType["multipleDropJump"]) {
        const mdjResult = latestStudiesByType["multipleDropJump"].results;
        compareDropJumpWithCMJ(
          mdjResult,
          results,
          trainingSolutions,
          "multipledropjump-cmj"
        );
      }
    }
    // Process Squat Jump test
    else if (studyType === "squatJump") {
      // Compare with latest CMJ
      if (latestStudiesByType["cmj"]) {
        const cmjResult = latestStudiesByType["cmj"].results;
        const ecrValue = calculateECR(
          cmjResult.avgHeightReached,
          results.avgHeightReached
        );
        addECRTrainingSolutions(ecrValue, trainingSolutions, "cmj-squatjump");
      }
    }
    // Process Abalakov test
    else if (studyType === "abalakov") {
      // Compare with latest CMJ
      if (latestStudiesByType["cmj"]) {
        const cmjResult = latestStudiesByType["cmj"].results;
        const armSwingContribution = calculateArmSwingContribution(
          results.avgHeightReached,
          cmjResult.avgHeightReached
        );
        addArmSwingTrainingSolutions(
          armSwingContribution,
          trainingSolutions,
          "abalakov-cmj"
        );
      }
    }
    // Process MultipleDropJump test
    else if (studyType === "multipleDropJump") {
      // Compare with latest CMJ
      if (latestStudiesByType["cmj"]) {
        const cmjResult = latestStudiesByType["cmj"].results;
        compareDropJumpWithCMJ(
          results,
          cmjResult,
          trainingSolutions,
          "multipledropjump-cmj"
        );
      }
    }
    // If it's a MultipleJumps test, calculate RSI
    else if (studyType === "multipleJumps") {
      calculateRSIFromMultipleJumps(
        results,
        trainingSolutions,
        "multiplejumps"
      );
    }
  });

  // Remove duplicate training solutions
  const uniqueSolutions = removeDuplicateTrainingSolutions(trainingSolutions);

  // If testType is provided, filter solutions relevant to that test type
  if (testType) {
    return filterRelevantSolutions(uniqueSolutions, testType);
  }

  return uniqueSolutions;
}

/**
 * Compare Drop Jump with CMJ and add appropriate training solutions
 * @param {Object} dropJumpResult - Drop Jump result
 * @param {Object} cmjResult - CMJ result
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
  if (dropJumpResult.dropJumps && dropJumpResult.dropJumps.length > 0) {
    // Iterate through all drop jumps to find the maximum height reached
    dropJumpResult.dropJumps.forEach((dropJump) => {
      if (dropJump.avgHeightReached > maxDropJumpHeight) {
        maxDropJumpHeight = dropJump.avgHeightReached;
      }
    });
  } else if (dropJumpResult.maxAvgHeightReached) {
    // If the property exists directly on the result
    maxDropJumpHeight = dropJumpResult.maxAvgHeightReached;
  }

  // Only calculate if we have valid heights
  if (maxDropJumpHeight > 0 && cmjResult.avgHeightReached > 0) {
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
 * @param {string} testType - Type of test that generated the results
 */
function calculateRSIFromMultipleJumps(results, trainingSolutions, testType) {
  let rsi = null;

  // Try different methods to calculate RSI based on available data

  // Method 1: Using times array to find max flight time and corresponding floor time
  if (results.times && results.times.length > 0) {
    let maxFlightTime = 0;
    let maxFlightTimeIndex = 0;

    results.times.forEach((time, index) => {
      if (time.flightTime > maxFlightTime) {
        maxFlightTime = time.flightTime;
        maxFlightTimeIndex = index;
      }
    });

    const correspondingFloorTime = results.times[maxFlightTimeIndex].floorTime;

    if (maxFlightTime > 0 && correspondingFloorTime > 0) {
      rsi = maxFlightTime / correspondingFloorTime;
    }
  }

  // Method 2: Using average flight time and floor time
  if (rsi === null && results.avgFlightTime > 0 && results.avgFloorTime > 0) {
    rsi = results.avgFlightTime / results.avgFloorTime;
  }

  // Method 3: Using stiffness and performance metrics as a proxy
  if (rsi === null && results.avgStiffness > 0 && results.avgPerformance > 0) {
    // A simplified proxy calculation - in practice this needs validation
    rsi = 2.0; // Default to a moderate RSI value
  }

  // Method 4: Default fallback
  if (rsi === null) {
    // If we can't calculate RSI, use a default value of 2.0
    // This provides generic recommendations for moderate RSI
    rsi = 2.0;
  }

  // Now that we have an RSI value, add the appropriate training solutions
  addRSITrainingSolutions(rsi, trainingSolutions, testType);
}

/**
 * Calculates Elastic Contribution Ratio (ECR)
 * @param {number} cmjHeight - CMJ height in cm
 * @param {number} sjHeight - Squat Jump height in cm
 * @returns {number} ECR as a percentage
 */
function calculateECR(cmjHeight, sjHeight) {
  if (!cmjHeight || !sjHeight || sjHeight === 0) return 0;
  return ((cmjHeight - sjHeight) / sjHeight) * 100;
}

/**
 * Calculates arm swing contribution
 * @param {number} abalakovHeight - Abalakov height in cm
 * @param {number} cmjHeight - CMJ height in cm
 * @returns {number} Arm swing contribution as a percentage
 */
function calculateArmSwingContribution(abalakovHeight, cmjHeight) {
  if (!abalakovHeight || !cmjHeight || cmjHeight === 0) return 0;
  return ((abalakovHeight - cmjHeight) / cmjHeight) * 100;
}

/**
 * Adds training solutions based on ECR value
 * @param {number} ecrValue - ECR value
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} comparisonType - Type of comparison that generated the ECR value
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
 * @param {string} comparisonType - Type of comparison that generated the value
 */
function addArmSwingTrainingSolutions(
  armSwingValue,
  trainingSolutions,
  comparisonType
) {
  // Arm swing <= 10%
  if (armSwingValue <= 10) {
    trainingSolutions.push({
      title: "Mala coordinación de brazos",
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
}

/**
 * Adds training solutions based on RSI value
 * @param {number} rsiValue - Reactive Strength Index value
 * @param {Array<TrainingSolution>} trainingSolutions - Array to add solutions to
 * @param {string} testType - Type of test that generated the RSI value
 */
function addRSITrainingSolutions(rsiValue, trainingSolutions, testType) {
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
      comparedTo: testType,
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
      comparedTo: testType,
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
      comparedTo: testType,
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
      comparedTo: testType,
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
      comparedTo: testType,
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
      comparedTo: testType,
    });
  }
}

/**
 * Removes duplicate training solutions based on title
 * @param {Array<TrainingSolution>} solutions - Array of training solutions
 * @returns {Array<TrainingSolution>} Filtered array without duplicates
 */
function removeDuplicateTrainingSolutions(solutions) {
  const uniqueTitles = new Set();
  return solutions.filter((solution) => {
    if (uniqueTitles.has(solution.title)) {
      return false;
    }
    uniqueTitles.add(solution.title);
    return true;
  });
}

// Export the interface definition for TypeScript environments
/**
 * @typedef {Object} TrainingSolution
 * @property {string} title - Title of the training solution
 * @property {string} info - Explanation of why this training is recommended
 * @property {string} exerciseType - Type of exercises recommended
 * @property {string[]} exerciseExamples - Examples of specific exercises
 * @property {string} comparedTo - The type of study that was compared to target study
 */
