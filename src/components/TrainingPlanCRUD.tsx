import React, { useState } from "react";
import { useBlur } from "../contexts/BlurContext";
import TrainingPlanCreator from "./TrainingPlanCreator";
import SessionInfoStage from "./SessionInfoStage";
import SessionOverviewStage from "./SessionOverviewStage";
import navAnimations from "../styles/animations.module.css";
import { TrainingBlock } from "../types/trainingPlan";

interface TrainingPlanCRUDProps {
  sessionIndex: number;
  setSessionIndex: (index: number) => void;
  currentWeek: number;
  setDisplayPopup: (display: boolean) => void;
  showExercisePopup: (
    type: "exercise" | "exerciseBlock",
    blockId?: string
  ) => void;
  showAddSessionPopup: () => void;
  onToggleCreatingPlan: () => void;
  isModel?: boolean;
  isNew?: boolean;
  showEditSessionPopup: (sessionId: string) => void;
  showEditBlockPopup: (block: TrainingBlock) => void;
}

const TrainingPlanCRUD: React.FC<TrainingPlanCRUDProps> = ({
  sessionIndex,
  setSessionIndex,
  currentWeek,
  setDisplayPopup,
  showExercisePopup,
  showAddSessionPopup,
  onToggleCreatingPlan,
  isModel = false,
  isNew = false,
  showEditSessionPopup,
  showEditBlockPopup,
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
        sessionIndex={sessionIndex}
        setSessionIndex={setSessionIndex}
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
        showAddSessionPopup={showAddSessionPopup}
        showEditSessionPopup={showEditSessionPopup}
        showEditBlockPopup={showEditBlockPopup}
      />
    ),
  };

  return <>{creationStages[currentStage]}</>;
};

export default TrainingPlanCRUD;
