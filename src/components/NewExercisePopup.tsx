import React, { useEffect } from "react";
import { useState } from "react";
import navAnimations from "../styles/animations.module.css";
import {
  EffortReduction,
  Exercise,
  Progression,
  VolumeReduction,
} from "../types/trainingPlan";
import SelectExercises from "./SelectExercises";
import ExerciseData from "./ExerciseData";
import LoadManagement from "./LoadManagement";
import { RangeEntry } from "../utils/fatigueHandling";
import { useNewPlan } from "../contexts/NewPlanContext";
import TrainingBlockData from "./TrainingBlockData";
import { getExercises } from "../hooks/parseTrainingData";
function NewExercisePopup({
  onClose,
  type = "exercise",
  sessionIndex,
  isModel = false,
}: {
  onClose: () => void;
  type: string;
  sessionIndex: number;
  isModel?: boolean;
}) {
  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);
  const [currentSection, setCurrentSection] =
    useState<string>("selectExercises");

  const {
    currentExerciseBlock,
    currentSelectedExercise,
    setCurrentSelectedExercise,
    saveSelectedExercise,
    addTrainingBlock,
  } = useNewPlan();

  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const [animations, setAnimations] = useState({
    selectExercises: "",
    exerciseData: "",
    loadManagement: "",
    // trainingBlockData: "",
  });

  const localOnContinue = () => {
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const onSelectExercise = (exercise: Exercise) => {
    if (selectedExercises.some((e) => e.id === exercise.id)) {
      setSelectedExercises(
        selectedExercises.filter((e) => e.id !== exercise.id)
      );
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
    if (type === "exercise") {
      continueExerciseBlock();
    }
  };

  const continueExerciseBlock = () => {
    goTo("selectExercises", "exerciseData");
  };

  const goTo = (previous: string, next: string) => {
    setAnimations({
      ...animations,
      [previous]: navAnimations.fadeOutLeft,
      [next]: navAnimations.fadeInRight,
    });
    setTimeout(() => {
      setCurrentSection(next);
    }, 200);
  };

  const onSave = (
    progression: Progression[] | null,
    fatigueHandling: VolumeReduction | EffortReduction | null,
    factorToReduce: "volume" | "effort" | undefined,
    blockModel: "sequential" | "series" | undefined
  ) => {
    let newSelectedExercise = {
      ...currentSelectedExercise,
    };
    if (factorToReduce === "volume") {
      newSelectedExercise.reduceVolume = {
        ...newSelectedExercise.reduceVolume,
        ...fatigueHandling,
      };
    } else if (factorToReduce === "effort") {
      newSelectedExercise.reduceEffort = {
        ...newSelectedExercise.reduceEffort,
        ...fatigueHandling,
      };
    }
    newSelectedExercise.progression = progression;
    if (type === "exercise") {
      saveSelectedExercise(sessionIndex, newSelectedExercise, isModel);
      setAnimation(navAnimations.popupFadeOutTop);
      setTimeout(() => {
        onClose();
      }, 200);
    } else {
      addTrainingBlock(
        sessionIndex,
        selectedExercises,
        newSelectedExercise,
        blockModel,
        isModel
      );
      setAnimation(navAnimations.popupFadeOutTop);
      setTimeout(() => {
        onClose();
      }, 200);
    }
  };

  const sections = {
    selectExercises: (
      <SelectExercises
        animation={animations.selectExercises}
        exercises={exercises}
        selectedExercises={selectedExercises}
        onSelectExercise={onSelectExercise}
        type={type}
        onContinue={
          type === "exerciseBlock" ? continueExerciseBlock : undefined
        }
      />
    ),
    exerciseData: (
      <ExerciseData
        animation={animations.exerciseData}
        selectedExercises={selectedExercises}
        onContinue={() => {
          goTo("exerciseData", "loadManagement");
        }}
        sessionIndex={sessionIndex}
        isModel={isModel}
      />
    ),
    loadManagement: (
      <LoadManagement
        animation={animations.loadManagement}
        selectedExercises={selectedExercises}
        onSave={onSave}
        isModel={isModel}
      />
    ),
    // trainingBlockData: (
    //   <TrainingBlockData
    //     animation={animations.trainingBlockData}
    //     sessionN={sessionIndex}
    //   />
    // ),
  };

  useEffect(() => {
    const loadExercises = async () => {
      const exercises = await getExercises();
      setExercises(exercises);
    };
    loadExercises();
  }, []);

  return (
    <div
      className={`bg-white absolute shadow-sm rounded-2xl left-[30%] top-2 flex flex-col items-center h-auto z-50 ${animation} overflow-y-scroll `}
      style={{ maxHeight: "95vh" }}
    >
      <div
        className="absolute z-50 hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localOnContinue}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>

      {sections[currentSection]}
    </div>
  );
}

export default NewExercisePopup;
