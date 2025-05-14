import { useNewPlan } from "../contexts/NewPlanContext";
import { TrainingBlock } from "../types/trainingPlan";
import React from "react";
import { useTranslation } from "react-i18next";

function BlockVolumeDisplay({
  sessionIndex,
  id,
}: {
  sessionIndex: number;
  id: string;
}) {
  const { t } = useTranslation();
  const { planState } = useNewPlan();

  const trainingBlock = planState.sessions[sessionIndex].exercises.find(
    (e) => e.id === id
  ) as TrainingBlock;
  return (
    <>
      <div className="flex items-center relative justify-center mt-8  ">
        <p className="absolute left-16 top-1/2 transform -translate-y-1/2">
          Modelo:{" "}
          <span className="text-secondary font-medium">
            {t(trainingBlock.blockModel)}
          </span>
        </p>
        <div className="w-[130px]" />
        <div className="bg-lightRed flex items-center justify-center rounded-t-2xl text-secondary px-8  font-medium text-xl mx-16">
          {trainingBlock.name}
        </div>
        <div className="flex items-center gap-x-2   hover:opacity-70 active:opacity-40  hover:cursor-pointer">
          <p className="text-secondary ">Editar bloque</p>
          <img src="/pencil.png" alt="Editar bloque" className="h-5 w-5" />
        </div>
      </div>
      <div className="rounded-2xl border border-lightRed">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `274px repeat(${
              trainingBlock.selectedExercises[0]?.progression.length || 0
            }, 224px)`,
          }}
        >
          {trainingBlock.selectedExercises.map((exercise, index) => (
            <React.Fragment key={index}>
              <div
                className={`text-lg flex items-center justify-center p-4 ${
                  index !== trainingBlock.selectedExercises.length - 1 &&
                  "border-b border-b-gray"
                }`}
              >
                {exercise.name}
              </div>
              {exercise.progression.map((p, pIndex) => (
                <div
                  key={pIndex}
                  className={`flex ${
                    index !== trainingBlock.selectedExercises.length - 1 &&
                    "border-b border-b-gray"
                  }`}
                >
                  <div className="w-1/3 text-lg flex items-center justify-center border-l border-l-lightRed border-r border-r-gray">
                    {p.series}
                  </div>
                  <div className="w-2/3 text-lg flex items-center justify-center">
                    {p.repetitions}
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}

export default BlockVolumeDisplay;
