import React, { useEffect } from "react";
import { Exercise } from "../types/trainingPlan";
function ExerciseCard({
  exercise,
  onSelectExercise,
  selected,
}: {
  exercise: Exercise;
  onSelectExercise: (exercise: Exercise) => void;
  selected: boolean;
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl flex relative flex-col hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out border border-gray "
      onClick={() => onSelectExercise(exercise)}
      style={{ borderColor: selected && "#e81d23" }}
    >
      <div className="h-40 w-full bg-orange-400"></div>
      <p className=" text-xl self-center mt-8 mb-4 truncate">
        {exercise.name.length > 20
          ? exercise.name.slice(0, 20) + "..."
          : exercise.name}
      </p>
    </div>
  );
}

export default ExerciseCard;
