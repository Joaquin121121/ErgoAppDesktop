import { TrainingBlock } from "../types/trainingPlan";
import React, { useEffect } from "react";
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
    <>
      <div className="flex items-center relative justify-center mt-8  w-full">
        <p className="absolute left-16 top-1/2 transform -translate-y-1/2">
          Modelo:{" "}
          <span className="text-secondary font-medium">
            {t(trainingBlock.blockModel)}
          </span>
        </p>
        <div className="w-[130px]" />
        <div className="bg-lightRed flex items-center justify-center rounded-t-2xl text-secondary px-8  font-medium text-xl mx-16">
          {trainingBlock.name}
        </div>
        <div className="flex items-center gap-x-2   hover:opacity-70 active:opacity-40  hover:cursor-pointer">
          <p className="text-secondary ">Editar bloque</p>
          <img src="/pencil.png" alt="Editar bloque" className="h-5 w-5" />
        </div>
      </div>
      <div className="grid grid-cols-1 rounded-2xl border border-lightRed  w-full">
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
    </>
  );
}

export default BlockAccordionItem;
