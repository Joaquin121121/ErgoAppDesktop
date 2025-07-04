import { useNewPlan } from "../contexts/NewPlanContext";
import {
  Progression,
  SelectedExercise,
  TrainingModel,
  DisplayProgression,
} from "../types/trainingPlan";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import inputStyles from "../styles/inputStyles.module.css";
import {
  formatProgression,
  initializeDisplayProgressionForSelectedExercise,
  validateReps,
} from "../utils/utils";

function SelectedExerciseVolumeDisplay({
  sessionIndex,
  id,
  currentWeek,
  isModel = false,
}: {
  sessionIndex: number;
  id: string;
  currentWeek: number;
  isModel?: boolean;
}) {
  const { t } = useTranslation();
  const { planState, model, setPlanState, setModel } = useNewPlan();

  const currentPlan = isModel ? model : planState;
  const setCurrentPlan = isModel ? setModel : setPlanState;

  const [displayProgression, setDisplayProgression] = useState<
    DisplayProgression[]
  >([]);

  const selectedExercise = currentPlan.sessions[sessionIndex].exercises.find(
    (e) => e.id === id
  ) as SelectedExercise;

  const resetDisplayProgression = () => {
    setDisplayProgression(
      initializeDisplayProgressionForSelectedExercise(selectedExercise)
    );
  };

  const onProgressionChange = (
    field: keyof Progression,
    value: string,
    index: number
  ) => {
    if (parseInt(value) < 0) {
      return;
    }
    setDisplayProgression((prev) => {
      const newDisplayProgression = [...prev];
      newDisplayProgression[index][field] = value;
      return newDisplayProgression;
    });
  };

  const onBlur = (index: number, field: keyof Progression) => {
    const newProgression: any[] = [...displayProgression];
    const intValue =
      typeof displayProgression[index][field] === "number"
        ? displayProgression[index][field]
        : parseInt(displayProgression[index][field]);
    if (intValue < 1) {
      resetDisplayProgression();
      return;
    }
    if (field === "repetitions") {
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

    const newSelectedExercise: SelectedExercise = { ...selectedExercise };
    newSelectedExercise.progression = newProgression;
    newSelectedExercise.series = newProgression[currentWeek].series;
    newSelectedExercise.repetitions = newProgression[currentWeek].repetitions;

    const newPlanState = { ...currentPlan };

    newPlanState.sessions[sessionIndex].exercises = newPlanState.sessions[
      sessionIndex
    ].exercises.map((e) => (e.id === id ? newSelectedExercise : e));

    if (isModel) {
      setCurrentPlan({
        ...newPlanState,
        name: (currentPlan as TrainingModel).name,
        description: (currentPlan as TrainingModel).description,
      } as TrainingModel);
    } else {
      setCurrentPlan(newPlanState);
    }
    setDisplayProgression(
      initializeDisplayProgressionForSelectedExercise(newSelectedExercise)
    );
  };

  useEffect(() => {
    resetDisplayProgression();
  }, [selectedExercise]);

  return (
    <div
      className="rounded-2xl border border-lightRed"
      style={{
        width: `calc(274px + ${
          (selectedExercise.progression.length || 0) * 224
        }px)`,
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `274px repeat(${
            selectedExercise.progression.length || 0
          }, 224px)`,
        }}
      >
        <div className="text-lg flex items-center justify-center p-4">
          {selectedExercise.name}
        </div>
        {displayProgression.map((p, pIndex) => (
          <div key={pIndex} className="flex">
            <div className="w-1/3 text-lg flex items-center justify-center border-l border-l-lightRed border-r border-r-gray">
              <input
                type="number"
                className={`w-12 rounded-2xl text-center ${inputStyles.input}`}
                value={p.series}
                onChange={(e) =>
                  onProgressionChange("series", e.target.value, pIndex)
                }
                onBlur={() => onBlur(pIndex, "series")}
              />
            </div>
            <div className="w-2/3 text-lg flex items-center justify-center">
              <input
                className={`w-24 rounded-2xl text-center ${inputStyles.input}`}
                value={p.repetitions}
                onChange={(e) =>
                  onProgressionChange("repetitions", e.target.value, pIndex)
                }
                onBlur={() => onBlur(pIndex, "repetitions")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectedExerciseVolumeDisplay;
