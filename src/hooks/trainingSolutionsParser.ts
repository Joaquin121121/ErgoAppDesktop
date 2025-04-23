import { useStudyContext } from "../contexts/StudyContext";
import {
  AbalakovResult,
  boscoTests,
  CMJResult,
  MultipleDropJumpResult,
  MultipleJumpsResult,
  SquatJumpResult,
} from "../types/Studies";

const assessArmSwingContribution = (
  cmj: CMJResult,
  abalakov: AbalakovResult
) => {
  const avgDiff = abalakov.avgFlightTime - cmj.avgFlightTime;

  if (avgDiff <= 10) {
    return {
      title: "Bajo nivel de coordinación de brazos",
      info: "La inercia que generan los brazos no impulsa el salto vertical. La diferencia de altura esperada es de 10-15%",
      exerciseType: "Ejercicios de coordinación de brazos",
      exerciseExamples: [
        "Saltos con ayuda de brazos con y sin sobrecarga externa ligera en brazos",
        "Saltos al cajón con ayuda de brazos",
        "Saltos a la torre con ayuda de brazos",
        "Saltos verticales consecutivos con ayuda de brazos",
      ],
    };
  }
};

const assessECR = (cmj: CMJResult, squatJump: SquatJumpResult) => {
  const ECR = (1 - squatJump.avgHeightReached / cmj.avgHeightReached) * 100;

  if (ECR < 10) {
    return {
      title: "Énfasis en componente elástico",
      info: "El tejido conectivo tiene poca capacidad de acumular energía elástica",
      exerciseType:
        "Ejercicios con la fase excéntrica acentuada, ejercicios isométricos en amplios ángulos articulares o ejercicios excéntricos cuasi-isométricos",
      exerciseExamples: [
        "Sentadillas con descenso controlado",
        "Sentadilla supramáxima excéntrica a una pierna",
        "Peso muerto con fase excéntrica controlada",
      ],
    };
  }
  if (ECR >= 10 && ECR < 20) {
    return {
      title: "Énfasis en ambas componentes",
      info: "Ambos componentes de la musculatura deben ser desarrollados en la misma magnitud.",
      exerciseType:
        "Se recomiendan ejercicios que estimulen el componente contráctil y el componente elástico equilibradamente como ejercicios isométricos, ejercicios solo concéntricos, ejercicios con pausas intrarepetición",
      exerciseExamples: [
        "Sentadilla isométrica a dos piernas",
        "Salto con sobrecarga",
        "Estocada con paso al frente",
      ],
    };
  }
  if (ECR > 20) {
    return {
      title: "Énfasis en componente contráctil",
      info: "El sujeto tiene gran capacidad de acumular energía elástica. Tiene buena calidad y cantidad de tejido conectivo principalmente en paralelo y también en serie",
      exerciseType:
        "Se recomiendan ejercicios de saltabilidad sin fase de vuelo previa, ejercicios tradicionales con fase excéntrica acentuada, ejercicios isométricos en amplios ángulos articulares",
      exerciseExamples: [
        "Sentadillas con acentuación excéntrica",
        "Salto con contramovimiento sin descenso previo",
        "Isometría en prensa 45°",
      ],
    };
  }
};

const assessDropJumpHeight = (
  cmj: CMJResult,
  multipleDropJump: MultipleDropJumpResult
) => {
  if (parseFloat(multipleDropJump.bestHeight) > cmj.avgHeightReached) {
    return {
      title: "Entrenar con drop jump",
      info: "El sujeto no puede elevar el centro de gravedad con su salto hasta la altura de caída óptima de drop jump",
      exerciseType: "Drop jump",
      exerciseExamples: [
        "Se sugiere entrenar drop jump con altura de caída óptima en base al mejor índice Q",
      ],
    };
  } else {
    return {
      title: "Entrenar con vallas",
      info: "El sujeto genera el mejor índice de calidad de salto a una altura a la que puede lograr saltar por sus propios medios",
      exerciseType: "Saltos con vallas",
      exerciseExamples: [
        "Se sugiere entrenar colocando obstáculos a la altura del mejor índice Q",
      ],
    };
  }
};

const assessRSI = (multipleJumpsTest: MultipleJumpsResult) => {
  const rsi =
    Math.floor(
      (multipleJumpsTest.avgFlightTime / multipleJumpsTest.avgFloorTime) * 100
    ) / 100;

  if (rsi < 1) {
    return {
      title: "Muy bajo índice de fuerza reactiva (<1)",
      info: "Capacidad de fuerza reactiva limitada, priorizar desarrollo de fuerza",
      exerciseType:
        "Se recomiendan ejercicios básicos priorizando la intensidad del ejercicio.",
      exerciseExamples: [
        "Sentadillas con pocas repeticiones y alta intensidad",
        "Prensa a 45 grados con pocas repeticiones y alta densidad",
        "Ejercicios coordinativos en escalerilla sin fase de vuelo",
      ],
    };
  }
  // RSI 1-1.5
  else if (rsi >= 1 && rsi < 1.5) {
    return {
      title: "Bajo índice de fuerza reactiva (1 - 1.5)",
      info: "Capacidad de fuerza reactiva limitada, priorizar desarrollo de fuerza",
      exerciseType:
        "Comenzar con saltabilidad tipo HOPS con mínima fase de vuelo",
      exerciseExamples: [
        "HOPS de intensidad moderada/baja con tiempos de contacto moderados",
        "Sentadillas con pocas repeticiones y alta intensidad",
        "Prensa a 45 grados con pocas repeticiones y alta densidad",
      ],
    };
  }
  // RSI 1.5-2
  else if (rsi >= 1.5 && rsi < 2) {
    return {
      title: "Moderado índice de fuerza reactiva (1.5 - 2)",
      info: "Moderada capacidad de acumulación de energía elástica principalmente en tendones",
      exerciseType:
        "Ejercicios de saltabilidad de intensidad moderada/alta con mínima flexión de tobillos y rodillas",
      exerciseExamples: [
        "Ejercicios de saltabilidad tipo HOPS con fase de vuelo de intensidad moderada/alta con tiempo de contacto bajo",
        "Ejercicios de saltabilidad tipo HOPS unilateral",
        "Saltar la soga con los tobillos y rodillas lo más rígido posible y con el menor tiempo de contacto",
      ],
    };
  }
  // RSI 2-2.5
  else if (rsi >= 2 && rsi < 2.5) {
    return {
      title: "Buen índice de fuerza reactiva (2 - 2.5)",
      info: "Moderada/buena capacidad de fuerza reactiva",
      exerciseType:
        "Se recomienda saltabilidad con fase de vuelo de moderada/alta intensidad",
      exerciseExamples: [
        "Saltos con vallas",
        "Saltos rebote en el lugar de alta intensidad",
        "Saltos con mínima asistencia",
      ],
    };
  }
  // RSI 2.5-3
  else if (rsi >= 2.5 && rsi < 3) {
    return {
      title: "Alto nivel de fuerza reactiva (2.5 - 3)",
      info: "Altos niveles de acumulación de energía elástica, buenos niveles de stiffness",
      exerciseType:
        "Se recomiendan ejercicios de saltabilidad de muy alta intensidad",
      exerciseExamples: [
        "Drop jumps",
        "Pliometría (shock method)",
        "Saltos con vallas con máxima intensidad y mínimo tiempo de contacto",
      ],
    };
  }
  // RSI > 3
  else if (rsi >= 3) {
    return {
      title: "Nivel de fuerza reactiva clase mundial (>3)",
      info: "Muy altos niveles de fuerza reactiva, capacidad limitada para mejorar la fuerza reactiva",
      exerciseType:
        "Se recomiendan ejercicios de saltabilidad de muy alta intensidad",
      exerciseExamples: [
        "Pliometría de alto nivel",
        "Drop jumps sobre superficies rígidas",
        "Saltabilidad con mínima fase de contacto sobre superficies rígidas",
      ],
    };
  }
};

export const trainingSolutions = (date: Date) => {
  const { athlete } = useStudyContext();
  const study = athlete.completedStudies.find((study) => study.date === date);

  const relevantComparisons = {
    cmj: ["squatJump", "abalakov", "dropJump"],
    squatJump: ["cmj"],
    abalakov: ["cmj"],
    dropJump: ["cmj"],
  };

  const studiesToCompare = [
    "cmj",
    "squatJump",
    "abalakov",
    "multipleDropJump",
    "multipleJump",
  ].filter((studyType) => studyType !== study.results.type);

  let relevantStudies = studiesToCompare.reduce((acc, study) => {
    const mostRecentStudyOfType = athlete.completedStudies.find(
      (completedStudy) => completedStudy.results.type === study
    );
    if (!mostRecentStudyOfType) {
      return acc;
    }
    return {
      ...acc,
      [study]: mostRecentStudyOfType,
    };
  }, {});

  const latestBosco = athlete.completedStudies.find(
    (study) => study.results.type === "bosco"
  );

  boscoTests.forEach((boscoTest) => {
    if (
      !relevantStudies[boscoTest] ||
      latestBosco.date > relevantStudies[boscoTest].date
    ) {
      relevantStudies[boscoTest] = latestBosco.results[boscoTest];
    }
  });

  let trainingSolutions = [];
  let armSwingContribution;
  let ecr;
  let dropJumpHeight;
  let rsi;
  switch (study.results.type) {
    case "cmj":
      armSwingContribution =
        relevantStudies["abalakov"] &&
        assessArmSwingContribution(study.results, relevantStudies["abalakov"]);
      ecr =
        relevantStudies["squatJump"] &&
        assessECR(study.results, relevantStudies["squatJump"]);
      dropJumpHeight =
        relevantStudies["multipleDropJumps"] &&
        assessDropJumpHeight(
          study.results,
          relevantStudies["multipleDropJumps"]
        );

      if (armSwingContribution) {
        trainingSolutions.push({
          ...armSwingContribution,
          comparedStudies: {
            cmj: study,
            abalakov: relevantStudies["abalakov"],
          },
          bosco: false,
        });
      }
      if (ecr) {
        trainingSolutions.push({
          ...ecr,
          comparedStudies: {
            squatJump: relevantStudies["squatJump"],
            cmj: study,
          },
          bosco: false,
        });
      }

      if (dropJumpHeight) {
        trainingSolutions.push({
          ...dropJumpHeight,
          comparedStudies: {
            cmj: study,
            dropJumpHeight: relevantStudies["multipleDropJump"],
          },
          bosco: false,
        });
      }
      return;
    case "squatJump":
      ecr =
        relevantStudies["cmj"] &&
        assessECR(relevantStudies["cmj"], study.results);
      if (ecr) {
        trainingSolutions.push({
          ...ecr,
          comparedStudies: {
            squatJump: study,
            cmj: relevantStudies["cmj"],
          },
          bosco: false,
        });
      }
      return;
    case "abalakov":
      armSwingContribution =
        relevantStudies["cmj"] &&
        assessArmSwingContribution(relevantStudies["cmj"], study.results);
      if (armSwingContribution) {
        trainingSolutions.push({
          ...armSwingContribution,
          comparedStudies: {
            cmj: relevantStudies["cmj"],
            abalakov: study,
          },
          bosco: false,
        });
      }
      return;
    case "multipleDropJump":
      dropJumpHeight =
        relevantStudies["cmj"] &&
        assessDropJumpHeight(relevantStudies["cmj"], study.results);
      if (dropJumpHeight) {
        trainingSolutions.push({
          ...dropJumpHeight,
          comparedStudies: {
            cmj: relevantStudies["cmj"],
            multipleDropJump: study,
          },
          bosco: false,
        });
      }
      return;
    case "multipleJumps":
      rsi = assessRSI(study.results);
      if (rsi) {
        trainingSolutions.push({
          ...rsi,
          comparedStudies: { multipleJumps: study },
          bosco: false,
        });
      }
      return;
    case "bosco":
      armSwingContribution = assessArmSwingContribution(
        study.results.cmj,
        study.results.abalakov
      );
      ecr = assessECR(study.results.cmj, study.results.squatJump);
      dropJumpHeight = assessDropJumpHeight(
        study.results.cmj,
        relevantStudies["multipleDropJump"]
      );
      trainingSolutions.push({
        ...armSwingContribution,
        comparedStudies: {
          cmj: study.results.cmj,
          abalakov: study.results.abalakov,
        },
        bosco: true,
      });
      trainingSolutions.push({
        ...ecr,
        comparedStudies: {
          squatJump: study.results.squatJump,
          cmj: study.results.cmj,
        },
        bosco: true,
      });
      trainingSolutions.push({
        ...dropJumpHeight,
        comparedStudies: {
          cmj: study.results.cmj,
          multipleDropJump: relevantStudies["multipleDropJump"],
        },
        bosco: true,
      });
  }

  return trainingSolutions;
};
