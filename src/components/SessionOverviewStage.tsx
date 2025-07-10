import React, { useEffect, useState } from "react";
import { useNewPlan } from "../contexts/NewPlanContext";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
import ExerciseAccordionItem from "./ExerciseAccordionItem";
import BlockAccordionItem from "./BlockAccordionItem";
import { useStudyContext } from "../contexts/StudyContext";
import { useBlur } from "../contexts/BlurContext";
import NewSessionPopup from "./NewSessionPopup";
import { TrainingBlock } from "../types/trainingPlan";

function SessionOverviewStage({
  animation,
  showPopup,
  sessionIndex,
  setSessionIndex,
  currentWeek,
  showAddSessionPopup,
  isModel = false,
  showEditSessionPopup,
  showEditBlockPopup,
}: {
  animation: string;
  showPopup: (type: "exercise" | "exerciseBlock", blockId?: string) => void;
  sessionIndex: number;
  setSessionIndex: (index: number) => void;
  currentWeek: number;
  showAddSessionPopup: () => void;
  isModel?: boolean;
  showEditSessionPopup: (sessionId: string) => void;
  showEditBlockPopup: (block: TrainingBlock) => void;
}) {
  const { planState, model, removeExercise } = useNewPlan();
  const { athlete } = useStudyContext();
  const currentPlan = isModel ? model : planState;
  const [localAnimation, setLocalAnimation] = useState(animation);
  const { setIsBlurred } = useBlur();
  const addExercise = () => {
    showPopup("exercise");
  };

  const addExerciseBlock = () => {
    showPopup("exerciseBlock");
  };

  const displayAddExercisePopup = (blockId: string) => {
    showPopup("exercise", blockId);
  };

  return (
    <div
      className={`relative flex flex-col items-center ${localAnimation}`}
      style={{
        height: isModel ? "85vh" : "90vh",
      }}
    >
      <p className="absolute left-4 top-4 text-secondary text-lg font-light">
        Semana {currentWeek + 1}
        {athlete?.name.length > 0 && (
          <span className="text-tertiary font-normal">: {athlete.name}</span>
        )}
      </p>
      <div className="flex items-center gap-x-4 mt-4">
        <p className="text-secondary text-3xl  self-center">
          {currentPlan.sessions[sessionIndex]?.name}
        </p>
        <div className="w-12 h-12 flex items-center justify-center hover:cursor-pointer hover:opacity-70 active:opacity-40">
          <img
            src="/pencil.png"
            className="h-7 w-7"
            alt=""
            onClick={() =>
              showEditSessionPopup(currentPlan.sessions[sessionIndex].id)
            }
          />
        </div>
      </div>
      <div className="w-[95%]  grid grid-cols-13 gap-x-4 mt-6 ">
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
      <div className="h-[65%] w-full flex justify-center overflow-y-scroll -pr-4">
        <div className="w-[96%] ml-4 ">
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
                    standalone
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
                    displayAddExercisePopup={displayAddExercisePopup}
                    showEditBlockPopup={showEditBlockPopup}
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
      <div className="flex items-center self-start absolute bottom-0">
        <div className="flex border-t border-r border-secondary rounded-tr-2xl overflow-hidden ">
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
        <div className="rounded-full ml-4 bg-lightRed h-7 w-7 flex items-center justify-center hover:cursor-pointer hover:opacity-70 active:opacity-40">
          <img
            src="addRed.png"
            alt=""
            className="h-5 w-5 "
            onClick={showAddSessionPopup}
          />
        </div>
      </div>
    </div>
  );
}

export default SessionOverviewStage;
