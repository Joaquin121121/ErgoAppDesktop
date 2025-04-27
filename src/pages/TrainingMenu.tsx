import { useBlur } from "../contexts/BlurContext";
import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect, useState } from "react";
import { parseAllTrainingSolutions } from "../hooks/trainingSolutionsParser";
import { useNavigate } from "react-router-dom";
import TonalButton from "../components/TonalButton";
import TrainingPlanCreator from "../components/TrainingPlanCreator";
import TrainingSolutionsPanel from "../components/TrainingSolutionsPanel";
import ModelChoicePopup from "../components/ModelChoicePopup";

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

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center  transition-all duration-300 ease-in-out ${animation}`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        <div
          className={`my-10 w-full flex justify-around items-center ${
            isBlurred && "blur-md pointer-events-none"
          }`}
        >
          <div className="w-[122px]" />
          <p className="text-3xl">
            Entrenamiento:{" "}
            <span className="text-secondary">{athlete.name}</span>
          </p>
          <TonalButton
            inverse
            title="Volver"
            icon="backWhite"
            onClick={onClose}
          />
        </div>
        <div className="flex-grow self-end w-[90%] flex justify-between transition-all duration-300 ease-in-out pr-8">
          <TrainingPlanCreator
            isCreatingPlan={creatingPlan}
            onToggleCreatingPlan={handleToggleCreatingPlan}
            displayPopup={() => {
              setIsBlurred(true);
              setDisplayPopup(true);
            }}
          />

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
    </>
  );
};

export default TrainingMenu;
