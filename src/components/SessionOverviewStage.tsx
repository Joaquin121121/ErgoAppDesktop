import React, { useEffect, useState } from "react";
import { useNewPlan } from "../contexts/NewPlanContext";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
import ExerciseAccordionItem from "./ExerciseAccordionItem";
import BlockAccordionItem from "./BlockAccordionItem";

function SessionOverviewStage({
  animation,
  showPopup,
  sessionIndex,
  setSessionIndex,
  currentWeek,
  isModel = false,
}: {
  animation: string;
  showPopup: (type: "exercise" | "exerciseBlock") => void;
  sessionIndex: number;
  setSessionIndex: (index: number) => void;
  currentWeek: number;
  isModel?: boolean;
}) {
  const { planState, model, removeExercise } = useNewPlan();
  const currentPlan = isModel ? model : planState;
  const [localAnimation, setLocalAnimation] = useState(animation);

  const addExercise = () => {
    showPopup("exercise");
  };

  const addExerciseBlock = () => {
    showPopup("exerciseBlock");
  };
  useEffect(() => {
    console.log(currentPlan.sessions[sessionIndex]?.exercises);
    console.log(currentPlan.sessions[sessionIndex]);
    console.log("currentPlan", currentPlan);
  }, [currentPlan.sessions[sessionIndex]?.exercises]);

  return (
    <div className={`flex flex-col items-center h-[94vh] ${localAnimation}`}>
      <p className="absolute left-4 top-4 text-secondary text-lg font-light">
        Semana {currentWeek + 1}
      </p>
      <p className="text-secondary text-3xl mt-4 self-center">
        {currentPlan.sessions[sessionIndex]?.name}
      </p>
      <div className="w-[90%] mx-auto grid grid-cols-13 gap-x-4 mt-6 ">
        <p className="text-darkGray text-xl text-center col-span-3">
          Ejercicio
        </p>
        <p className="text-darkGray text-xl text-center col-span-2">Sets</p>
        <p className="text-darkGray text-xl text-center col-span-2">Reps</p>
        <p className="text-darkGray text-xl text-center col-span-2">
          Intensidad
        </p>
        <p className="text-darkGray text-xl text-center col-span-2">Descanso</p>
        <div className="h-7 w-7"></div>
        <div className="h-10 w-10"></div>
      </div>
      <div className="h-[65%] w-full flex justify-center overflow-y-scroll">
        <div className="w-[90%] mx-auto">
          {currentPlan.sessions[sessionIndex]?.exercises?.map(
            (exercise, index) => {
              if (exercise.type === "selectedExercise") {
                return (
                  <ExerciseAccordionItem
                    key={exercise.id}
                    id={exercise.id}
                    currentWeek={currentWeek}
                    sessionIndex={sessionIndex}
                    isModel={isModel}
                  />
                );
              }
              if (
                exercise.type === "trainingBlock" &&
                exercise.selectedExercises.length > 0
              ) {
                return (
                  <BlockAccordionItem
                    key={exercise.id}
                    id={exercise.id}
                    currentWeek={currentWeek}
                    sessionIndex={sessionIndex}
                    isModel={isModel}
                  />
                );
              }
            }
          )}
        </div>
      </div>
      <div className="flex w-full items-center justify-center gap-x-8 mt-8 mb-4">
        <OutlinedButton
          title="Añadir Ejercicio"
          icon="addRed"
          onClick={addExercise}
        ></OutlinedButton>
        <TonalButton
          title="Añadir Bloque"
          icon="add"
          onClick={addExerciseBlock}
        ></TonalButton>
      </div>
      <div className="self-start absolute bottom-0 flex border-t border-r border-secondary rounded-tr-2xl overflow-hidden mt-12">
        {currentPlan.sessions.map((session, index) => {
          return (
            <button
              key={session?.id}
              className={` py-2 px-4  ${
                index !== currentPlan.sessions.length - 1 &&
                "border-r-secondary"
              } hover:opacity-70 hover:cursor-pointer active:opacity-40 focus:outline-none rounded-none`}
              style={{
                backgroundColor: sessionIndex === index && "#FFC1C1",
                color: sessionIndex === index && "#e81d23",
              }}
              onClick={() => setSessionIndex(index)}
            >
              {session?.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SessionOverviewStage;
