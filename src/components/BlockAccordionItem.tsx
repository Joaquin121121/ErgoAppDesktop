import { TrainingBlock } from "../types/trainingPlan";
import React, { useEffect, useRef, useState } from "react";
import ExerciseAccordionItem from "./ExerciseAccordionItem";
import { useTranslation } from "react-i18next";
import { useNewPlan } from "../contexts/NewPlanContext";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

function BlockAccordionItem({
  block,
  currentWeek,
  sessionIndex,
  displayAddExercisePopup,
  isModel = false,
  showEditBlockPopup,
}: {
  block: TrainingBlock;
  currentWeek: number;
  sessionIndex: number;
  displayAddExercisePopup: (blockId: string) => void;
  isModel?: boolean;
  showEditBlockPopup: (block: TrainingBlock) => void;
}) {
  const { t } = useTranslation();
  const {
    planState,
    model,
    currentSelectedExercise,
    moveExerciseToIndexWithinBlock,
  } = useNewPlan();
  const currentPlan = isModel ? model : planState;
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  const [expandedItemsNumber, setExpandedItemsNumber] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [lastSwapTime, setLastSwapTime] = useState<number>(0);

  const getExerciseIndex = (exerciseId: string) => {
    return block.selectedExercises.findIndex(
      (exercise) => exercise.id === exerciseId
    );
  };

  const handleDragStart = (event) => {
    setActiveExerciseId(event.active.id);
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
      moveExerciseToIndexWithinBlock(
        sessionIndex,
        block.id,
        active.id,
        overIndex,
        isModel
      );
      setLastSwapTime(now);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveExerciseId(null);

    // No need to do anything here since we're handling swaps in handleDragOver
    // The final position is already set by the continuous swapping
  };

  const handleDragCancel = () => {
    setActiveExerciseId(null);
    // Optionally reset to original position if needed
  };

  // Custom collision detection for exercises within blocks
  const customCollisionDetection = (args) => {
    // For immediate swapping, prioritize pointer-based collision for all items
    // This makes the swapping more responsive and immediate
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Fallback to rect intersection
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    // Final fallback to closest center
    return closestCenter(args);
  };

  const activeExercise = activeExerciseId
    ? block.selectedExercises.find(
        (exercise) => exercise.id === activeExerciseId
      )
    : null;

  const addExercise = () => {
    displayAddExercisePopup(block.id);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  return (
    <div
      className="flex relative w-full text-center transition-all duration-300 mb-8"
      ref={setNodeRef}
      style={style}
    >
      <p
        style={{
          writingMode: "vertical-rl",
          height:
            (
              block.selectedExercises.length * 64.8 +
              1.5 +
              expandedItemsNumber * 199
            ).toString() + "px",
          transition: "height 0.3s ease-in-out",
        }}
        onClick={() => showEditBlockPopup(block)}
        className="absolute hover:cursor-pointer hover:opacity-70 active:opacity-40 transition-opacity duration-300  ease-in-out truncate left-0 z-50 transform  px-1 py-2 -rotate-180 text-xl font-medium text-secondary bg-lightRed rounded-r-2xl"
        {...attributes}
        {...listeners}
      >
        {block.name}
      </p>
      <div
        className="flex flex-col items-center mb  -4 w-full"
        style={{
          height:
            (
              78 * block.selectedExercises.length -
              (block.selectedExercises.length - 1) * 13 +
              expandedItemsNumber * 199
            ).toString() + "px",
          transition: "height 0.3s ease-in-out",
        }}
      >
        <div className="grid grid-cols-1  flex-1 flex-grow  rounded-2xl border border-lightRed  w-full relative">
          <DndContext
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={block.selectedExercises.map((exercise) => exercise.id)}
              strategy={verticalListSortingStrategy}
            >
              {block.selectedExercises.map((exercise, index) => (
                <ExerciseAccordionItem
                  key={exercise.id}
                  exercise={exercise}
                  currentWeek={currentWeek}
                  blockId={block.id}
                  last={index === block.selectedExercises.length - 1}
                  sessionIndex={sessionIndex}
                  isModel={isModel}
                  expandedItemsFromBlock={expandedItemsNumber}
                  setExpandedItemsFromBlock={setExpandedItemsNumber}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeExercise && (
                <div
                  className="opacity-90 shadow-2xl pointer-events-none"
                  style={{
                    transform: "translate(-16%, -175%)",
                    cursor: "grabbing",
                  }}
                >
                  <ExerciseAccordionItem
                    exercise={activeExercise}
                    currentWeek={currentWeek}
                    blockId={block.id}
                    last={false}
                    sessionIndex={sessionIndex}
                    isModel={isModel}
                    expandedItemsFromBlock={expandedItemsNumber}
                    setExpandedItemsFromBlock={setExpandedItemsNumber}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
        <p
          className="absolute left-9 -bottom-5 rounded-b-2xl bg-lightRed  px-4  font-light py-1 hover:cursor-pointer hover:opacity-70 active:opacity-40 transition-opacity duration-300  ease-in-out"
          onClick={() => showEditBlockPopup(block)}
          {...attributes}
          {...listeners}
        >
          Modelo: <span className="font-medium">{t(block.blockModel)}</span>
        </p>
        <div className="flex z-50 justify-center gap-x-8 right-1/2 transform -translate-x-1/2 -mt-4">
          <div className="w-7 h-7 hover:cursor-pointer hover:opacity-70 active:opacity-40  flex items-center rounded-full justify-center  bg-lightRed">
            <img
              src="/addRed.png"
              alt="Añadir bloque"
              className="h-5 w-5"
              onClick={addExercise}
            />
          </div>
          <div className="w-7 h-7 hover:cursor-pointer hover:opacity-70 active:opacity-40  flex items-center rounded-full justify-center  bg-lightRed">
            <img
              src="/pencil.png"
              alt="Editar bloque"
              className="h-5 w-5"
              onClick={() => showEditBlockPopup(block)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlockAccordionItem;
