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
  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl flex relative flex-col hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out border border-gray "
      onClick={() => onSelectExercise(exercise)}
      style={{ borderColor: selected && "#e81d23" }}
    >
      <div className="h-40 w-full bg-orange-400"></div>
      <p className=" text-xl self-center mt-8 mb-4">{exercise.name}</p>
    </div>
  );
}

export default ExerciseCard;
