import { TrainingBlock } from "../types/trainingPlan";
import React, { useEffect, useRef } from "react";
import ExerciseAccordionItem from "./ExerciseAccordionItem";
import { useTranslation } from "react-i18next";
import { useNewPlan } from "../contexts/NewPlanContext";

function BlockAccordionItem({
  id,
  currentWeek,
  sessionIndex,
  isModel = false,
}: {
  id: string;
  currentWeek: number;
  sessionIndex: number;
  isModel?: boolean;
}) {
  const { t } = useTranslation();
  const { planState, model, currentSelectedExercise } = useNewPlan();
  const currentPlan = isModel ? model : planState;

  const trainingBlock = currentPlan.sessions[sessionIndex].exercises.find(
    (e) => e.id === id
  ) as TrainingBlock;

  return (
    <div className="flex relative w-full text-center">
      <p
        style={{
          writingMode: "vertical-rl",
          height:
            (trainingBlock.selectedExercises.length * 64).toString() + "px",
        }}
        className="absolute  -left-9 z-50 transform  -rotate-180 text-xl font-medium text-secondary"
      >
        {trainingBlock.name}
      </p>
      <div className="flex flex-col items-center mb-12 w-full transform scale-x-[104%]">
        <div className="grid grid-cols-1 -ml-[40px]  rounded-2xl border border-l-[36px] border-lightRed  w-full relative">
          {trainingBlock.selectedExercises.map((exercise, index) => (
            <ExerciseAccordionItem
              key={exercise.id}
              id={exercise.id}
              currentWeek={currentWeek}
              blockId={id}
              last={index === trainingBlock.selectedExercises.length - 1}
              sessionIndex={sessionIndex}
              isModel={isModel}
            />
          ))}
        </div>
        <p className="absolute left-4 -bottom-5 rounded-b-2xl bg-lightRed  px-4  font-light py-1">
          Modelo:{" "}
          <span className="font-medium">{t(trainingBlock.blockModel)}</span>
        </p>
        <div className="w-7 h-7 hover:cursor-pointer hover:opacity-70 active:opacity-40  flex items-center rounded-full justify-center right-1/2 transform -translate-x-1/2 -mt-4 bg-lightRed">
          <img src="/addRed.png" alt="Añadir bloque" className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default BlockAccordionItem;
