import { useBlur } from "../contexts/BlurContext";
import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect, useState } from "react";
import { parseAllTrainingSolutions } from "../hooks/trainingSolutionsParser";
import { useNavigate } from "react-router-dom";
import TonalButton from "../components/TonalButton";
import TrainingPlanCreator from "../components/TrainingPlanCreator";
import TrainingSolutionsPanel from "../components/TrainingSolutionsPanel";
import ModelChoicePopup from "../components/ModelChoicePopup";
import SessionInfoStage from "../components/SessionInfoStage";
import navAnimations from "../styles/animations.module.css";
import SessionOverviewStage from "../components/SessionOverviewStage";
import NewExercisePopup from "../components/NewExercisePopup";
import OutlinedButton from "../components/OutlinedButton";
import TrainingVolumePopup from "../components/TrainingVolumePopup";
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

  const [creatingPlan, setCreatingPlan] = useState(false);
  const [collapseAccordion, setCollapseAccordion] = useState(false);
  const [displayPopup, setDisplayPopup] = useState(false);
  const [currentStage, setCurrentStage] = useState("initialStage");
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
    setStagesAnimations(initialAnimations);
    setCurrentStage("initialStage");
    setCreatingPlan(!creatingPlan);
  };

  const initialAnimations = {
    initialStage: navAnimations.fadeInRight,
    sessionInfoStage: navAnimations.fadeInRight,
    sessionOverviewStage: navAnimations.fadeInRight,
  };

  const [stagesAnimations, setStagesAnimations] = useState(initialAnimations);

  const creationStages = {
    initialStage: (
      <TrainingPlanCreator
        isCreatingPlan={creatingPlan}
        onNext={() => {
          goToStage("initialStage", "sessionInfoStage");
        }}
        displayPopup={() => {
          setIsBlurred(true);
          setDisplayPopup(true);
        }}
        animation={stagesAnimations.initialStage}
        handleToggleCreatingPlan={handleToggleCreatingPlan}
      />
    ),
    sessionInfoStage: (
      <SessionInfoStage
        animation={stagesAnimations.sessionInfoStage}
        onNext={() => {
          goToStage("sessionInfoStage", "sessionOverviewStage");
        }}
      />
    ),
    sessionOverviewStage: (
      <SessionOverviewStage
        animation={stagesAnimations.sessionOverviewStage}
        showPopup={showExercisePopup}
        setSessionIndex={setSessionIndex}
        sessionIndex={sessionIndex}
        currentWeek={currentWeek}
      />
    ),
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
          {showPopup && (
            <NewExercisePopup
              onClose={closeExercisePopup}
              type={showPopup}
              sessionIndex={sessionIndex}
            />
          )}

          <div
            className={`bg-white rounded-2xl overflow-hidden relative shadow-sm  transition-[width,opacity] duration-500 ease-in-out -ml-8 mr-16 ${
              isBlurred && "blur-md pointer-events-none"
            }`}
            style={{ width: creatingPlan ? "70%" : "40%" }}
          >
            {creatingPlan && (
              <div
                className="absolute hover:opacity-70 z-50 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
                onClick={handleToggleCreatingPlan}
              >
                <img src="/close.png" className="h-6 w-6" alt="" />
              </div>
            )}
            {creationStages[currentStage]}
          </div>

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
