import SeamlessLoopPlayer from "../components/SeamlessLoopPlayer";
import TonalButton from "../components/TonalButton";
import { useBlur } from "../contexts/BlurContext";
import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect } from "react";
import {
  getAllTrainingSolutions,
  TrainingSolution,
} from "../hooks/getTrainingSolutions";
import CustomAccordion from "../components/CustomAccordion";

const TrainingMenu = ({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) => {
  const { athlete } = useStudyContext();

  const trainingSolutions: TrainingSolution[] = getAllTrainingSolutions() || [];

  // Format the accordion items
  const accordionItems = trainingSolutions.map((solution) => ({
    title: solution.title,
    content: (
      <ul className="list-disc pl-4">
        <li className="text-tertiary mb-2">{solution.info}</li>
        <li className="text-tertiary mb-2">{solution.exerciseType}</li>
        <li className="text-tertiary">
          Ejemplos de ejercicios:
          <ul className="list-circle pl-8">
            {solution.exerciseExamples.map((example, i) => (
              <li key={i} className="text-tertiary">
                {example}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    ),
  }));

  const { isBlurred } = useBlur();

  useEffect(() => {
    console.log("s:", trainingSolutions);
  }, [trainingSolutions]);
  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{
        paddingLeft: isExpanded ? "100px" : "32px",
      }}
    >
      <p className="my-10 text-3xl">
        Entrenamiento: <span className="text-secondary">{athlete.name}</span>
      </p>
      <div className="flex-grow self-end w-[90%] flex items-center justify-center gap-x-16 transition-all duration-300 ease-in-out pr-8">
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center w-2/5">
          <div className="flex items-center justify-center gap-x-8 mt-8">
            <p className="text-secondary text-2xl">Plan de Entrenamiento</p>
            <img src="/trainingRed.png" alt="" className="h-8 w-8" />
          </div>
          <SeamlessLoopPlayer
            src="/studying.mov"
            height={400}
            width={600}
            loop
            timeBetweenReplays={3}
          />
          <p className="text-xl mt-16 mb-8">No hay ningun plan cargado...</p>
          <TonalButton
            title="Crear Plan"
            icon="next"
            containerStyles="self-center mb-8"
            onClick={() => {}}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center w-3/5 h-full">
          <div className="flex items-center justify-center gap-x-8 mt-8">
            <p className="text-secondary text-2xl">
              Soluciones de Entrenamiento
            </p>
            <img src="/trainingRed.png" alt="" className="h-8 w-8" />
          </div>
          <CustomAccordion items={accordionItems} />
        </div>
      </div>
    </div>
  );
};

export default TrainingMenu;
