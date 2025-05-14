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
}: {
  animation: string;
  showPopup: (type: "exercise" | "exerciseBlock") => void;
  sessionIndex: number;
  setSessionIndex: (index: number) => void;
}) {
  const { planState, removeExercise } = useNewPlan();
  const [localAnimation, setLocalAnimation] = useState(animation);
  const [currentWeek, setCurrentWeek] = useState(0);

  const addExercise = () => {
    showPopup("exercise");
  };

  const addExerciseBlock = () => {
    showPopup("exerciseBlock");
  };
  useEffect(() => {
    console.log(planState.sessions[sessionIndex].exercises);
  }, [planState.sessions[sessionIndex].exercises]);

  return (
    <div className={`flex flex-col items-center ${localAnimation}`}>
      <p className="absolute left-4 top-4 text-secondary text-lg font-light">
        Semana {currentWeek + 1}
      </p>
      <p className="text-secondary text-3xl mt-8 self-center">
        {planState.sessions[sessionIndex].name}
      </p>
      <div className="w-[90%] mx-auto grid grid-cols-8 gap-x-4 mt-10 ">
        <p className="text-darkGray text-xl text-center col-span-2">
          Ejercicio
        </p>
        <p className="text-darkGray text-xl text-center">Sets</p>
        <p className="text-darkGray text-xl text-center">Reps</p>
        <p className="text-darkGray text-xl text-center">Intensidad</p>
        <p className="text-darkGray text-xl text-center">Descanso</p>
        <div className="h-7 w-7"></div>
        <div className="h-10 w-10"></div>
      </div>
      {planState.sessions[sessionIndex].exercises.map((exercise, index) => {
        if (exercise.type === "selectedExercise") {
          return (
            <ExerciseAccordionItem
              key={exercise.id}
              id={exercise.id}
              currentWeek={currentWeek}
              sessionIndex={sessionIndex}
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
            />
          );
        }
      })}

      <OutlinedButton
        title="Añadir Ejercicio"
        icon="addRed"
        onClick={addExercise}
        containerStyles="mt-16 self-center"
      ></OutlinedButton>
      <TonalButton
        title="Añadir Bloque"
        icon="add"
        onClick={addExerciseBlock}
        containerStyles="mt-4 mb-8 self-center"
      ></TonalButton>
      <div className="self-start flex border-t border-r border-secondary rounded-tr-2xl overflow-hidden mt-12">
        {planState.sessions.map((session, index) => {
          return (
            <button
              key={session.id}
              className={` py-2 px-4  ${
                index !== planState.sessions.length - 1 && "border-r-secondary"
              } hover:opacity-70 hover:cursor-pointer active:opacity-40 focus:outline-none rounded-none`}
              style={{
                backgroundColor: sessionIndex === index && "#FFC1C1",
                color: sessionIndex === index && "#e81d23",
              }}
              onClick={() => setSessionIndex(index)}
            >
              {session.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SessionOverviewStage;
