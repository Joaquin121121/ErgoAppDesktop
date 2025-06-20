import React, { useState } from "react";
import { useBlur } from "../contexts/BlurContext";
import TrainingPlanCreator from "./TrainingPlanCreator";
import SessionInfoStage from "./SessionInfoStage";
import SessionOverviewStage from "./SessionOverviewStage";
import navAnimations from "../styles/animations.module.css";

interface TrainingPlanCRUDProps {
  sessionIndex: number;
  setSessionIndex: (index: number) => void;
  currentWeek: number;
  setDisplayPopup: (display: boolean) => void;
  showExercisePopup: (type: "exercise" | "exerciseBlock") => void;
  onToggleCreatingPlan: () => void;
  isModel?: boolean;
  isNew?: boolean;
}

const TrainingPlanCRUD: React.FC<TrainingPlanCRUDProps> = ({
  sessionIndex,
  setSessionIndex,
  currentWeek,
  setDisplayPopup,
  showExercisePopup,
  onToggleCreatingPlan,
  isModel = false,
  isNew = false,
}) => {
  const { setIsBlurred } = useBlur();
  const [currentStage, setCurrentStage] = useState(
    isNew ? "initialStage" : "sessionOverviewStage"
  );

  const initialAnimations = {
    initialStage: navAnimations.fadeInRight,
    sessionInfoStage: navAnimations.fadeInRight,
    sessionOverviewStage: navAnimations.fadeInRight,
  };

  const [stagesAnimations, setStagesAnimations] = useState(initialAnimations);

  const handleToggleCreatingPlan = () => {
    setStagesAnimations(initialAnimations);
    setCurrentStage("initialStage");
    onToggleCreatingPlan();
  };

  const goToStage = (prevStage: string, nextStage: string) => {
    setStagesAnimations({
      ...stagesAnimations,
      [prevStage]: navAnimations.fadeOutLeft,
      [nextStage]: navAnimations.fadeInRight,
    });
    setTimeout(() => {
      setCurrentStage(nextStage);
    }, 200);
  };

  const creatorOnNext = (usingModel: boolean) => {
    if (usingModel) {
      goToStage("initialStage", "sessionOverviewStage");
    } else {
      goToStage("initialStage", "sessionInfoStage");
    }
  };

  const creationStages = {
    initialStage: (
      <TrainingPlanCreator
        isCreatingPlan={true}
        onNext={creatorOnNext}
        displayPopup={() => {
          setIsBlurred(true);
          setDisplayPopup(true);
        }}
        animation={stagesAnimations.initialStage}
        handleToggleCreatingPlan={handleToggleCreatingPlan}
        isModel={isModel}
      />
    ),
    sessionInfoStage: (
      <SessionInfoStage
        animation={stagesAnimations.sessionInfoStage}
        onNext={() => {
          goToStage("sessionInfoStage", "sessionOverviewStage");
        }}
        isModel={isModel}
      />
    ),
    sessionOverviewStage: (
      <SessionOverviewStage
        animation={stagesAnimations.sessionOverviewStage}
        showPopup={showExercisePopup}
        setSessionIndex={setSessionIndex}
        sessionIndex={sessionIndex}
        currentWeek={currentWeek}
        isModel={isModel}
      />
    ),
  };

  return (
    <>
      {!isModel && (
        <div
          className="absolute hover:opacity-70 z-50 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
          onClick={handleToggleCreatingPlan}
        >
          <img src="/close.png" className="h-6 w-6" alt="" />
        </div>
      )}
      {creationStages[currentStage]}
    </>
  );
};

export default TrainingPlanCRUD;
