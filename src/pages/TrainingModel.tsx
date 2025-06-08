import React, { useState } from "react";
import TonalButton from "../components/TonalButton";
import { useBlur } from "../contexts/BlurContext";
import { useNavigate } from "react-router-dom";
import { useNewPlan } from "../contexts/NewPlanContext";
import TrainingPlanCRUD from "../components/TrainingPlanCRUD";
import TrainingVolumePopup from "../components/TrainingVolumePopup";
import ModelChoicePopup from "../components/ModelChoicePopup";
import NewExercisePopup from "../components/NewExercisePopup";
import useBackspaceNavigation from "../hooks/useBackspaceNavigation";
import { useSearchParams } from "react-router-dom";
const TrainingModel = ({
  animation,
  isExpanded,
  customNavigate,
}: {
  animation: string;
  isExpanded: boolean;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) => {
  const { isBlurred, setIsBlurred } = useBlur();
  const navigate = useNavigate();
  const { model } = useNewPlan();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  // Add missing state variables that TrainingPlanCRUD needs
  const [sessionIndex, setSessionIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [displayPopup, setDisplayPopup] = useState(false);
  const [showPopup, setShowPopup] = useState<
    "exercise" | "exerciseBlock" | null
  >(null);
  const [displayVolumePopup, setDisplayVolumePopup] = useState(false);
  const [closePopup, setClosePopup] = useState(false);

  const showExercisePopup = (type: "exercise" | "exerciseBlock") => {
    setShowPopup(type);
    setIsBlurred(true);
  };

  const closeExercisePopup = () => {
    setShowPopup(null);
    setIsBlurred(false);
  };

  const showVolumePopup = () => {
    setDisplayVolumePopup(true);
    setIsBlurred(true);
  };

  const closeVolumePopup = () => {
    setDisplayVolumePopup(false);
    setIsBlurred(false);
  };

  const onToggleCreatingPlan = () => {
    // Implementation for toggling creation plan if needed
  };

  const onClose = () => {
    customNavigate("back", "trainingModel", "trainingModelLibrary");
    setTimeout(() => {
      navigate("/trainingModelLibrary");
    }, 300);
  };
  useBackspaceNavigation(onClose);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          isBlurred && "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        <div className="my-10 w-4/5 flex justify-around items-center">
          <div className="w-[122px]" />

          <p className="text-3xl">
            Modelo de Entrenamiento:{" "}
            <span className="text-secondary">{model.name}</span>
          </p>

          <TonalButton
            inverse
            title="Volver"
            icon="backWhite"
            onClick={onClose}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-sm flex flex-col w-4/5">
          <TrainingPlanCRUD
            sessionIndex={sessionIndex}
            setSessionIndex={setSessionIndex}
            currentWeek={currentWeek}
            setDisplayPopup={setDisplayPopup}
            showExercisePopup={showExercisePopup}
            onToggleCreatingPlan={onToggleCreatingPlan}
            isModel={true}
            isNew={isNew}
          />
        </div>
      </div>
      {showPopup && (
        <NewExercisePopup
          onClose={closeExercisePopup}
          type={showPopup}
          sessionIndex={sessionIndex}
          isModel={true}
        />
      )}
      {displayPopup && (
        <ModelChoicePopup
          closePopup={() => {
            setIsBlurred(false);
            setDisplayPopup(false);
          }}
          externalClose={closePopup}
          isModel={true}
        />
      )}

      {displayVolumePopup && (
        <TrainingVolumePopup
          closePopup={closeVolumePopup}
          sessionIndex={sessionIndex}
          currentWeek={currentWeek}
          isModel={true}
        />
      )}
    </>
  );
};

export default TrainingModel;
