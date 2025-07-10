import { TrainingBlock } from "../types/trainingPlan";
import React, { useEffect, useRef, useState } from "react";
import ExerciseAccordionItem from "./ExerciseAccordionItem";
import { useTranslation } from "react-i18next";
import { useNewPlan } from "../contexts/NewPlanContext";

function BlockAccordionItem({
  id,
  currentWeek,
  sessionIndex,
  displayAddExercisePopup,
  isModel = false,
  showEditBlockPopup,
}: {
  id: string;
  currentWeek: number;
  sessionIndex: number;
  displayAddExercisePopup: (blockId: string) => void;
  isModel?: boolean;
  showEditBlockPopup: (block: TrainingBlock) => void;
}) {
  const { t } = useTranslation();
  const { planState, model, currentSelectedExercise } = useNewPlan();
  const currentPlan = isModel ? model : planState;

  const trainingBlock = currentPlan.sessions[sessionIndex].exercises.find(
    (e) => e.id === id
  ) as TrainingBlock;
  const [expandedItemsNumber, setExpandedItemsNumber] = useState(0);

  const addExercise = () => {
    displayAddExercisePopup(id);
  };

  return (
    <div className="flex relative w-full text-center transition-all duration-300">
      <p
        style={{
          writingMode: "vertical-rl",
          height:
            (
              trainingBlock.selectedExercises.length * 64.8 +
              1.5 +
              expandedItemsNumber * 199
            ).toString() + "px",
          transition: "height 0.3s ease-in-out",
        }}
        onClick={() => showEditBlockPopup(trainingBlock)}
        className="absolute hover:cursor-pointer hover:opacity-70 active:opacity-40 transition-opacity duration-300  ease-in-out truncate left-0 z-50 transform  px-1 py-2 -rotate-180 text-xl font-medium text-secondary bg-lightRed rounded-r-2xl"
      >
        {trainingBlock.name}
      </p>
      <div
        className="flex flex-col items-center mb-12 w-full"
        style={{
          height:
            (
              78 * trainingBlock.selectedExercises.length -
              (trainingBlock.selectedExercises.length - 1) * 13 +
              expandedItemsNumber * 199
            ).toString() + "px",
          transition: "height 0.3s ease-in-out",
        }}
      >
        <div className="grid grid-cols-1  flex-1 flex-grow  rounded-2xl border border-lightRed  w-full relative">
          {trainingBlock.selectedExercises.map((exercise, index) => (
            <ExerciseAccordionItem
              key={exercise.id}
              id={exercise.id}
              currentWeek={currentWeek}
              blockId={id}
              last={index === trainingBlock.selectedExercises.length - 1}
              sessionIndex={sessionIndex}
              isModel={isModel}
              expandedItemsFromBlock={expandedItemsNumber}
              setExpandedItemsFromBlock={setExpandedItemsNumber}
            />
          ))}
        </div>
        <p
          className="absolute left-9 bottom-7 rounded-b-2xl bg-lightRed  px-4  font-light py-1 hover:cursor-pointer hover:opacity-70 active:opacity-40 transition-opacity duration-300  ease-in-out"
          onClick={() => showEditBlockPopup(trainingBlock)}
        >
          Modelo:{" "}
          <span className="font-medium">{t(trainingBlock.blockModel)}</span>
        </p>
        <div className="w-7 h-7 hover:cursor-pointer hover:opacity-70 active:opacity-40  flex items-center rounded-full justify-center right-1/2 transform -translate-x-1/2 -mt-4 bg-lightRed">
          <img
            src="/addRed.png"
            alt="Añadir bloque"
            className="h-5 w-5"
            onClick={addExercise}
          />
        </div>
      </div>
    </div>
  );
}

export default BlockAccordionItem;
