import { useNewPlan } from "../contexts/NewPlanContext";
import React, { useEffect, useState } from "react";

function TrainingBlockData({
  animation,
  sessionN,
}: {
  animation: string;
  sessionN: number;
}) {
  const { planState, setPlanState } = useNewPlan();
  const [exercisesInSeries, setExercisesInSeries] = useState(false);

  useEffect(() => {
    console.log(planState.sessions[sessionN].exercises);
  }, [planState]);
  return (
    <div className={`flex flex-col items-center w-[50vw] ${animation}`}>
      <p className="text-secondary text-2xl mt-8">
        Añadir Bloque de Ejercicios
      </p>
      <div className="flex flex-col pl-20 w-full">
        <div className="flex gap-x-8 mt-8 mb-2 items-center">
          <p className="text-darkGray text-lg">Ejercicios en serie</p>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              exercisesInSeries
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setExercisesInSeries(true)}
          >
            Sí
          </button>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              exercisesInSeries === false
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setExercisesInSeries(false)}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrainingBlockData;
