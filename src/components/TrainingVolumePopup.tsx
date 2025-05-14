import React, { useState } from "react";
import navAnimations from "../styles/animations.module.css";
import { useNewPlan } from "../contexts/NewPlanContext";
import BlockVolumeDisplay from "./BlockVolumeDisplay";

function TrainingVolumePopup({
  closePopup,
  sessionIndex,
}: {
  closePopup: () => void;
  sessionIndex: number;
}) {
  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);
  const { planState } = useNewPlan();

  const localClose = () => {
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      closePopup();
    }, 200);
  };
  return (
    <div
      className={`bg-white rounded-2xl absolute left-1/2  -translate-x-1/2 top-8 w-[80%] px-8  overflow-x-scroll ${animation}`}
    >
      <div
        className="absolute z-50 hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <div className="flex flex-col items-center">
        <p className="text-secondary text-2xl mt-4 mb-8">
          Sesión {sessionIndex + 1}
        </p>
        <div
          className="flex"
          style={{
            width: `calc(274px + ${planState.nOfWeeks * 224}px)`,
          }}
        >
          <div className="w-[274px] flex items-center justify-center text-darkGray text-lg flex-shrink-0">
            Ejercicio
          </div>
          {Array.from({ length: planState.nOfWeeks }, (_, index) => (
            <div
              key={index}
              className="w-[224px]  flex flex-col items-center flex-shrink-0"
            >
              <p className="text-darkGray text-lg">Semana {index + 1}</p>
              <div className="flex w-full">
                <div className="w-1/3 flex justify-center items-center text-darkGray text-lg">
                  Series
                </div>
                <div className="w-2/3 flex justify-center items-center text-darkGray text-lg">
                  Repeticiones
                </div>
              </div>
            </div>
          ))}
        </div>
        {planState.sessions[sessionIndex].exercises.map(
          (exercise) =>
            exercise.type === "trainingBlock" && (
              <BlockVolumeDisplay
                key={exercise.id}
                id={exercise.id}
                sessionIndex={sessionIndex}
              />
            )
        )}
      </div>
    </div>
  );
}

export default TrainingVolumePopup;
