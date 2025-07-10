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
import NewSessionPopup from "../components/NewSessionPopup";
import EditSessionPopup from "../components/EditSessionPopup";
import { TrainingBlock } from "../types/trainingPlan";
import EditBlockPopup from "../components/EditBlockPopup";
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
  const [blockId, setBlockId] = useState<string | null>(null);
  const [displayAddSessionPopup, setDisplayAddSessionPopup] = useState(false);
  const [displayEditSessionPopup, setDisplayEditSessionPopup] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [displayEditBlockPopup, setDisplayEditBlockPopup] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<TrainingBlock | null>(null);
  const showEditBlockPopup = (block: TrainingBlock) => {
    setCurrentBlock(block);
    setDisplayEditBlockPopup(true);
    setIsBlurred(true);
  };
  const showAddSessionPopup = () => {
    setDisplayAddSessionPopup(true);
    setIsBlurred(true);
  };
  const showEditSessionPopup = (sessionId: string) => {
    setSessionId(sessionId);
    setDisplayEditSessionPopup(true);
    setIsBlurred(true);
  };
  const showExercisePopup = (
    type: "exercise" | "exerciseBlock",
    blockId: string
  ) => {
    console.log("type:", type);
    console.log("blockId:", blockId);
    setShowPopup(type);
    setIsBlurred(true);
    setBlockId(blockId || null);
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
          maxHeight: "100vh",
        }}
      >
        <div className="my-10 w-4/5 flex justify-around items-center">
          <div className="w-[122px]" />

          <p className="text-3xl">
            {model.name ? (
              <>
                Modelo de Entrenamiento:{" "}
                <span className="text-secondary">{model.name}</span>
              </>
            ) : (
              "Nuevo Modelo de Entrenamiento"
            )}
          </p>

          <TonalButton title="Guardar" icon="next" onClick={onClose} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm flex flex-col w-4/5 h-4/5 overflow-y-hidden">
          <TrainingPlanCRUD
            sessionIndex={sessionIndex}
            setSessionIndex={setSessionIndex}
            currentWeek={currentWeek}
            setDisplayPopup={setDisplayPopup}
            showExercisePopup={showExercisePopup}
            onToggleCreatingPlan={onToggleCreatingPlan}
            isModel={true}
            isNew={isNew}
            showAddSessionPopup={showAddSessionPopup}
            showEditSessionPopup={showEditSessionPopup}
            showEditBlockPopup={showEditBlockPopup}
          />
        </div>
      </div>
      {showPopup && (
        <NewExercisePopup
          onClose={closeExercisePopup}
          type={showPopup}
          sessionIndex={sessionIndex}
          isModel={true}
          blockId={blockId}
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
      {displayAddSessionPopup && (
        <NewSessionPopup
          onClose={() => {
            setIsBlurred(false);
            setDisplayAddSessionPopup(false);
          }}
          isModel={true}
          sessionIndex={sessionIndex}
          setSessionIndex={setSessionIndex}
        />
      )}
      {displayEditSessionPopup && (
        <EditSessionPopup
          onClose={() => {
            setIsBlurred(false);
            setDisplayEditSessionPopup(false);
            setSessionId(null);
          }}
          isModel={true}
          sessionId={sessionId}
          sessionIndex={sessionIndex}
          setSessionIndex={setSessionIndex}
        />
      )}
      {displayEditBlockPopup && (
        <EditBlockPopup
          onClose={() => {
            setDisplayEditBlockPopup(false);
            setIsBlurred(false);
            setCurrentBlock(null);
          }}
          trainingBlock={currentBlock}
        />
      )}
    </>
  );
};

export default TrainingModel;
