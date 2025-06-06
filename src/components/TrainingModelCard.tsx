import React from "react";
import { TrainingModel } from "../types/trainingPlan";
function TrainingModelCard({
  model,
  onClick,
  onDelete,
}: {
  model: TrainingModel;
  onClick: () => void;
  onDelete: (name: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 pt-4 overflow-hidden"
      onClick={onClick}
    >
      <div
        className="flex absolute right-2 top-2 hover:opacity-70 hover:cursor-pointer px-2 pb-4 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(model.name);
        }}
      >
        <img src="/delete.png" className="h-8 w-8" alt="" />
      </div>
      <h6 className="text-secondary mb-2 text-2xl">{model.name}</h6>
      <p className="text-xl mb-8 text-tertiary">{model.description}</p>
      <div className="flex mb-8 w-3/4 items-center">
        <img
          src="/trainingSessionRed.png"
          alt="nOfSessions"
          className="h-8 w-8"
        />
        <p className="ml-4 font-light text-darkGray text-lg">
          {model.nOfSessions} sesiones
        </p>
      </div>
      <div className="flex mb-8 w-3/4 items-center">
        <img src="/calendar.png" alt="nOfWeeks" className="h-8 w-8" />
        <p className="ml-4 font-light text-darkGray text-lg">
          {model.nOfWeeks} semanas
        </p>
      </div>
    </div>
  );
}

export default TrainingModelCard;
