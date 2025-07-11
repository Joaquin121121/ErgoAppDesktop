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
import {
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";

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
  const { planState, model, removeExercise, moveExerciseToIndex } =
    useNewPlan();
  const { athlete } = useStudyContext();
  const currentPlan = isModel ? model : planState;
  const [localAnimation, setLocalAnimation] = useState(animation);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastSwapTime, setLastSwapTime] = useState<number>(0);
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

  const getExerciseIndex = (exerciseId: string) => {
    return currentPlan.sessions[sessionIndex]?.exercises.findIndex(
      (exercise) => exercise.id === exerciseId
    );
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Throttle swaps to prevent excessive re-renders (allow swap every 100ms)
    const now = Date.now();
    if (now - lastSwapTime < 100) {
      return;
    }

    const activeIndex = getExerciseIndex(active.id);
    const overIndex = getExerciseIndex(over.id);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      // Immediately swap positions during drag
      moveExerciseToIndex(sessionIndex, active.id, overIndex, isModel);
      setLastSwapTime(now);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    // No need to do anything here since we're handling swaps in handleDragOver
    // The final position is already set by the continuous swapping
  };

  const handleDragCancel = () => {
    setActiveId(null);
    // Optionally reset to original position if needed
  };

  const activeExercise = activeId
    ? currentPlan.sessions[sessionIndex]?.exercises.find(
        (exercise) => exercise.id === activeId
      )
    : null;

  // Custom collision detection that handles size differences between exercises and blocks
  const customCollisionDetection = (args) => {
    const { active, droppableContainers } = args;

    // Get the active item to determine its type
    const activeItem = currentPlan.sessions[sessionIndex]?.exercises.find(
      (exercise) => exercise.id === active.id
    );

    if (!activeItem) {
      return closestCenter(args);
    }

    // For immediate swapping, prioritize pointer-based collision for all items
    // This makes the swapping more responsive and immediate
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // For exercises (smaller items), use rect intersection as fallback
    if (activeItem.type === "selectedExercise") {
      const rectCollisions = rectIntersection(args);
      if (rectCollisions.length > 0) {
        return rectCollisions;
      }
    }

    // For blocks (larger items), use closest center as fallback
    return closestCenter(args);
  };

  const changeSessionIndex = (index: number) => {
    setSessionIndex(index);
  };

  return (
    <div
      className={`relative flex flex-col items-center overflow-x-hidden ${localAnimation}`}
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
        <div className="w-[96%] ml-4 flex flex-col gap-y-2">
          <DndContext
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={currentPlan.sessions[sessionIndex]?.exercises.map(
                (exercise) => exercise.id
              )}
              strategy={verticalListSortingStrategy}
            >
              {currentPlan.sessions[sessionIndex]?.exercises.map(
                (exercise, index) => {
                  if (exercise.type === "selectedExercise") {
                    return (
                      <ExerciseAccordionItem
                        key={exercise.id}
                        exercise={exercise}
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
                        block={exercise}
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
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeExercise && activeExercise.type === "trainingBlock" && (
                <div
                  className="opacity-90 shadow-2xl pointer-events-none"
                  style={{
                    transform: "translate(-16%, -50%)",
                    cursor: "grabbing",
                  }}
                >
                  <BlockAccordionItem
                    block={activeExercise}
                    currentWeek={currentWeek}
                    sessionIndex={sessionIndex}
                    isModel={isModel}
                    displayAddExercisePopup={displayAddExercisePopup}
                    showEditBlockPopup={showEditBlockPopup}
                  />
                </div>
              )}
              {activeExercise && activeExercise.type === "selectedExercise" && (
                <div
                  className="opacity-90 shadow-2xl pointer-events-none"
                  style={{
                    transform: "translate(-16%, -200%)",
                    cursor: "grabbing",
                  }}
                >
                  <ExerciseAccordionItem
                    exercise={activeExercise}
                    currentWeek={currentWeek}
                    sessionIndex={sessionIndex}
                    isModel={isModel}
                    standalone
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
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
                onClick={() => changeSessionIndex(index)}
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
