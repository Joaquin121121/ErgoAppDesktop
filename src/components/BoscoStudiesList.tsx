import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { camelToNatural } from "../utils/utils";

const SortableItem = ({ id, index, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isThisItemDragging,
  } = useSortable({
    id,
    transition: {
      duration: 150, // Faster transition
      easing: "cubic-bezier(0.25, 1, 0.5, 1)", // Snappier easing
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none", // Prevents touch scrolling while dragging
    cursor: isThisItemDragging ? "grabbing" : "grab",
    zIndex: isThisItemDragging ? 999 : "auto",
  };

  const className = `
    w-48 rounded-2xl p-2 mb-2 border 
    ${
      isThisItemDragging ? "bg-lightRed border-secondary" : "border-transparent"
    } 
    ${
      !isDragging && !isThisItemDragging
        ? "hover:border-secondary hover:bg-lightRed hover:bg-opacity-70"
        : ""
    } 
    transition-colors duration-200
  `;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={className}
    >
      <p className="text-secondary text-lg">
        {index + 1}. {camelToNatural(id)}
      </p>
    </div>
  );
};

const BoscoStudiesList = ({ studies, setStudy }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start dragging after moving 5px
        delay: 0, // No delay before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setIsDragging(false);

    if (active.id !== over.id) {
      const oldIndex = studies.indexOf(active.id);
      const newIndex = studies.indexOf(over.id);

      const newStudies = arrayMove(studies, oldIndex, newIndex);
      setStudy((prev) => ({
        ...prev,
        studies: newStudies,
      }));
    }
  };

  return (
    <div className="flex flex-col px-8 relative">
      <p className="text-black text-xl absolute right-20 top-20">
        Arrastre un test para cambiarlo de orden
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={studies} strategy={verticalListSortingStrategy}>
          <div className="mt-2">
            {studies.map((study, index) => (
              <SortableItem
                key={study}
                id={study}
                index={index}
                isDragging={isDragging}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default BoscoStudiesList;
