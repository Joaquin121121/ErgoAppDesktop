import { useBlur } from "../contexts/BlurContext";
import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect, useState } from "react";
import { parseAllTrainingSolutions } from "../hooks/trainingSolutionsParser";
import { useNavigate } from "react-router-dom";
import TonalButton from "../components/TonalButton";
import TrainingSolutionsPanel from "../components/TrainingSolutionsPanel";
import OutlinedButton from "../components/OutlinedButton";
import TrainingVolumePopup from "../components/TrainingVolumePopup";
import TrainingPlanCRUD from "../components/TrainingPlanCRUD";
import SeamlessLoopPlayer from "../components/SeamlessLoopPlayer";
import ModelChoicePopup from "../components/ModelChoicePopup";
import NewExercisePopup from "../components/NewExercisePopup";
import { useNewPlan } from "../contexts/NewPlanContext";

const TrainingMenu = ({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) => {
  const { athlete } = useStudyContext();
  const navigate = useNavigate();
  const [closePopup, setClosePopup] = useState(false);
  const { setPlanState, resetPlan } = useNewPlan();

  const trainingSolutions = parseAllTrainingSolutions() || [];

  // Format the accordion items
  const accordionItems = trainingSolutions.map((solution) => ({
    title: solution.title,
    content: (
      <ul className="list-disc pl-4">
        <li className="text-tertiary mb-2">{solution.info}</li>
        <li className="text-tertiary mb-2">{solution.exerciseType}</li>
        <li className="text-tertiary">
          Ejemplos de ejercicios:
          <ul className="list-circle pl-8">
            {solution.exerciseExamples.map((example, i) => (
              <li key={i} className="text-tertiary">
                {example}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    ),
  }));

  const { isBlurred, setIsBlurred } = useBlur();

  const [creatingPlan, setCreatingPlan] = useState(
    !!athlete.currentTrainingPlan
  );
  const [collapseAccordion, setCollapseAccordion] = useState(false);
  const [displayPopup, setDisplayPopup] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [showPopup, setShowPopup] = useState<
    "exercise" | "exerciseBlock" | null
  >(null);
  const [displayVolumePopup, setDisplayVolumePopup] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  const showExercisePopup = (type: "exercise" | "exerciseBlock") => {
    setShowPopup(type);
    setIsBlurred(true);
  };

  const showVolumePopup = () => {
    setDisplayVolumePopup(true);
    setIsBlurred(true);
  };

  const closeExercisePopup = () => {
    setShowPopup(null);
    setIsBlurred(false);
  };

  const closeVolumePopup = () => {
    setDisplayVolumePopup(false);
    setIsBlurred(false);
  };

  const onClose = async () => {
    customNavigate("back", "trainingMenu", "athleteMenu");
    setTimeout(() => {
      navigate("/athleteMenu");
    }, 300);
  };

  const handleToggleCreatingPlan = () => {
    setCreatingPlan(!creatingPlan);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger onClose if Backspace is pressed AND no input/textarea is focused
      if (
        event.key === "Backspace" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName
        )
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setCollapseAccordion(true);
  }, [creatingPlan]);

  useEffect(() => {
    resetPlan();
  }, []);

  useEffect(() => {
    if (!athlete.currentTrainingPlan?.nOfWeeks) return;
    setPlanState(athlete.currentTrainingPlan);
  }, [athlete.currentTrainingPlan]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center  transition-all duration-300 ease-in-out ${animation} ${
          displayVolumePopup ? "blur-md pointer-events-none" : ""
        }`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        <div
          className={`my-10 w-4/5 flex justify-around items-center${
            isBlurred && "blur-md pointer-events-none"
          }`}
        >
          <div className="w-[122px]" />
          <div className="w-[122px]" />
          <p className="text-3xl">
            Entrenamiento:{" "}
            <span className="text-secondary">{athlete.name}</span>
          </p>
          <OutlinedButton
            title="Ver Rendimiento"
            onClick={showVolumePopup}
            icon="performance"
          />
          <TonalButton
            inverse
            title="Volver"
            icon="backWhite"
            onClick={onClose}
          />
        </div>
        <div
          className={`self-end w-[90%] flex justify-between items-start transition-all duration-300 ease-in-out pr-8 
            mb-4`}
        >
          <div
            className={`bg-white rounded-2xl overflow-hidden relative shadow-sm transition-[width,opacity] duration-500 ease-in-out -ml-8 mr-16 ${
              isBlurred && "blur-md pointer-events-none"
            }`}
            style={{ width: creatingPlan ? "70%" : "40%" }}
          >
            {creatingPlan ? (
              <TrainingPlanCRUD
                sessionIndex={sessionIndex}
                setSessionIndex={setSessionIndex}
                currentWeek={currentWeek}
                setDisplayPopup={setDisplayPopup}
                showExercisePopup={showExercisePopup}
                onToggleCreatingPlan={handleToggleCreatingPlan}
                isNew={!athlete.currentTrainingPlan}
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-x-8 mt-8">
                  <p className="text-secondary text-2xl">
                    Plan de Entrenamiento
                  </p>
                  <img src="/trainingRed.png" alt="" className="h-8 w-8" />
                </div>
                <SeamlessLoopPlayer
                  src="/studying.mov"
                  height={400}
                  width={400}
                  loop
                  timeBetweenReplays={3}
                />
                <p className="text-xl mt-16 mb-8">
                  No hay ningun plan cargado...
                </p>
                <TonalButton
                  title="Crear Plan"
                  icon="add"
                  containerStyles="self-center mb-8"
                  onClick={handleToggleCreatingPlan}
                />
              </div>
            )}
          </div>

          {showPopup && (
            <NewExercisePopup
              onClose={closeExercisePopup}
              type={showPopup}
              sessionIndex={sessionIndex}
            />
          )}

          <TrainingSolutionsPanel
            isCreatingPlan={creatingPlan}
            accordionItems={accordionItems}
            collapseAccordion={collapseAccordion}
            onCollapseComplete={() => setCollapseAccordion(false)}
            goToTests={() => {
              customNavigate("forward", "trainingMenu", "studies");
              setClosePopup(true);
              setTimeout(() => {
                navigate("/studies");
              }, 300);
            }}
          />
        </div>
      </div>
      {displayPopup && (
        <ModelChoicePopup
          closePopup={() => {
            setIsBlurred(false);
            setDisplayPopup(false);
          }}
          externalClose={closePopup}
        />
      )}
      {displayVolumePopup && (
        <TrainingVolumePopup
          closePopup={closeVolumePopup}
          sessionIndex={sessionIndex}
          currentWeek={currentWeek}
        />
      )}
    </>
  );
};

export default TrainingMenu;
