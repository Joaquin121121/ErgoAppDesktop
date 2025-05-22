import { useNewPlan } from "../contexts/NewPlanContext";
import { Progression, TrainingBlock } from "../types/trainingPlan";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import inputStyles from "../styles/inputStyles.module.css";
import {
  formatProgression,
  initializeDisplayProgressionCollection,
  validateReps,
} from "../utils/utils";
import { DisplayProgressionCollection } from "../types/trainingPlan";

function BlockVolumeDisplay({
  sessionIndex,
  id,
  currentWeek,
}: {
  sessionIndex: number;
  id: string;
  currentWeek: number;
}) {
  const { t } = useTranslation();
  const { planState, setPlanState } = useNewPlan();

  const [displayProgression, setDisplayProgression] =
    useState<DisplayProgressionCollection>({});

  const trainingBlock = planState.sessions[sessionIndex].exercises.find(
    (e) => e.id === id
  ) as TrainingBlock;

  const resetDisplayProgression = () => {
    setDisplayProgression(
      initializeDisplayProgressionCollection(trainingBlock)
    );
  };

  const onProgressionChange = (
    field: keyof Progression,
    value: string,
    exerciseId: string,
    index: number
  ) => {
    if (parseInt(value) < 0) {
      return;
    }
    setDisplayProgression((prev) => {
      const newDisplayProgression = { ...prev };
      newDisplayProgression[exerciseId][index][field] = value;
      return newDisplayProgression;
    });
  };

  const onBlur = (
    exerciseId: string,
    index: number,
    field: keyof Progression
  ) => {
    const newProgression: any[] = [...displayProgression[exerciseId]];
    const intValue =
      typeof displayProgression[exerciseId][index][field] === "number"
        ? displayProgression[exerciseId][index][field]
        : parseInt(displayProgression[exerciseId][index][field]);
    if (intValue < 1) {
      resetDisplayProgression();
      return;
    }
    if (field === "repetitions") {
      console.log(newProgression[index][field], newProgression[index].series);
      if (
        !validateReps(
          newProgression[index][field],
          newProgression[index].series
        )
      ) {
        resetDisplayProgression();
        return;
      }
      newProgression[index][field] = newProgression[index][field];
    } else {
      newProgression[index][field] = Number(newProgression[index][field]);
    }
    const newTrainingBlock: TrainingBlock = { ...trainingBlock };
    newTrainingBlock.selectedExercises.find(
      (e) => e.id === exerciseId
    ).progression = newProgression;
    newTrainingBlock.selectedExercises.find((e) => e.id === exerciseId).series =
      newProgression[currentWeek].series;
    newTrainingBlock.selectedExercises.find(
      (e) => e.id === exerciseId
    ).repetitions = newProgression[currentWeek].repetitions;
    const newPlanState = { ...planState };

    newPlanState.sessions[sessionIndex].exercises = newPlanState.sessions[
      sessionIndex
    ].exercises.map((e) => (e.id === exerciseId ? newTrainingBlock : e));
    setPlanState(newPlanState);
    setDisplayProgression(
      initializeDisplayProgressionCollection(newTrainingBlock)
    );
  };

  useEffect(() => {
    resetDisplayProgression();
  }, [trainingBlock]);

  return (
    <>
      <div
        className="flex items-center relative justify-center mt-8"
        style={{
          width: `calc(274px + ${
            (trainingBlock.selectedExercises[0]?.progression.length || 0) * 224
          }px)`,
        }}
      >
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
      <div
        className="rounded-2xl border border-lightRed"
        style={{
          width: `calc(274px + ${
            (trainingBlock.selectedExercises[0]?.progression.length || 0) * 224
          }px)`,
        }}
      >
        <div
          className="grid "
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
              {displayProgression[exercise.id]?.map((p, pIndex) => (
                <div
                  key={pIndex}
                  className={`flex ${
                    index !== trainingBlock.selectedExercises.length - 1 &&
                    "border-b border-b-gray"
                  }`}
                >
                  <div className="w-1/3 text-lg flex items-center justify-center border-l border-l-lightRed border-r border-r-gray">
                    <input
                      type="number"
                      className={`w-12 rounded-2xl  text-center ${inputStyles.input}`}
                      value={p.series}
                      onChange={(e) =>
                        onProgressionChange(
                          "series",
                          e.target.value,
                          exercise.id,
                          pIndex
                        )
                      }
                      onBlur={() => onBlur(exercise.id, pIndex, "series")}
                    />
                  </div>
                  <div className="w-2/3 text-lg flex items-center justify-center">
                    <input
                      className={`w-24 rounded-2xl  text-center ${inputStyles.input}`}
                      value={p.repetitions}
                      onChange={(e) =>
                        onProgressionChange(
                          "repetitions",
                          e.target.value,
                          exercise.id,
                          pIndex
                        )
                      }
                      onBlur={() => onBlur(exercise.id, pIndex, "repetitions")}
                    />
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
