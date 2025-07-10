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
import NewSessionPopup from "../components/NewSessionPopup";
import EditSessionPopup from "../components/EditSessionPopup";
import EditBlockPopup from "../components/EditBlockPopup";
import { TrainingBlock } from "@/types/trainingPlan";

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
  const { setPlanState, resetPlan, planState } = useNewPlan();
  const { setHideNav } = useBlur();
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
  const [displayAddSessionPopup, setDisplayAddSessionPopup] = useState(false);
  const [displayVolumePopup, setDisplayVolumePopup] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<TrainingBlock | null>(null);
  const [displayEditSessionPopup, setDisplayEditSessionPopup] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [displayEditBlockPopup, setDisplayEditBlockPopup] = useState(false);
  const showExercisePopup = (
    type: "exercise" | "exerciseBlock",
    blockId: string
  ) => {
    setShowPopup(type);
    setIsBlurred(true);
    setBlockId(blockId || null);
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

  const showEditBlockPopup = (block: TrainingBlock) => {
    setCurrentBlock(block);

    setDisplayEditBlockPopup(true);
    setIsBlurred(true);
  };

  const showVolumePopup = () => {
    setDisplayVolumePopup(true);
    setIsBlurred(true);
  };

  const closeExercisePopup = () => {
    setBlockId(null);
    setShowPopup(null);
    setIsBlurred(false);
  };

  const closeVolumePopup = () => {
    setDisplayVolumePopup(false);
    setIsBlurred(false);
  };

  const onClose = async () => {
    setHideNav(false);
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
      >
        <div
          className={`w-full flex justify-between  transition-all duration-300 ease-in-out
            mb-4`}
          style={{ paddingTop: !athlete.currentTrainingPlan ? "2vh" : "0" }}
        >
          <div
            className={`bg-white rounded-2xl ml-4 mt-8 overflow-hidden relative shadow-sm transition-[width,opacity] duration-500 ease-in-out mr-8 ${
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
                showAddSessionPopup={showAddSessionPopup}
                showEditSessionPopup={showEditSessionPopup}
                showEditBlockPopup={showEditBlockPopup}
              />
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-secondary text-3xl my-4">{athlete.name}</p>
                <p className="text-2xl">Plan de Entrenamiento</p>

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
              blockId={blockId}
            />
          )}
          <div
            className={`flex flex-col items-center relative  pr-4  ${
              displayAddSessionPopup || displayEditBlockPopup
                ? "blur-md pointer-events-none"
                : ""
            }`}
            style={{ width: creatingPlan ? "30%" : "60%" }}
          >
            <div
              className="flex w-full  items-center my-8"
              style={{
                justifyContent:
                  planState.sessions[sessionIndex]?.exercises.length > 0
                    ? "space-between"
                    : "end",
              }}
            >
              {planState.sessions[sessionIndex]?.exercises.length > 0 && (
                <OutlinedButton
                  title="Ondulacion de Cargas"
                  onClick={showVolumePopup}
                  icon="performance"
                />
              )}
              {planState.nOfSessions > 0 ? (
                <TonalButton title="Guardar" icon="next" onClick={onClose} />
              ) : (
                <TonalButton
                  title="Volver"
                  icon="backWhite"
                  inverse
                  onClick={onClose}
                />
              )}
            </div>
            <TrainingSolutionsPanel
              isCreatingPlan={creatingPlan}
              accordionItems={accordionItems}
              collapseAccordion={collapseAccordion}
              onCollapseComplete={() => setCollapseAccordion(false)}
              goToTests={() => {
                customNavigate("forward", "trainingMenu", "studies");
                setHideNav(false);
                setClosePopup(true);
                setTimeout(() => {
                  navigate("/studies");
                }, 300);
              }}
            />
          </div>
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
      {displayAddSessionPopup && (
        <NewSessionPopup
          onClose={() => {
            setIsBlurred(false);
            setDisplayAddSessionPopup(false);
          }}
          isModel={false}
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
          isModel={false}
          sessionId={sessionId}
          sessionIndex={sessionIndex}
          setSessionIndex={setSessionIndex}
        />
      )}

      {displayEditBlockPopup && (
        <EditBlockPopup
          onClose={() => setDisplayEditBlockPopup(false)}
          trainingBlock={planState.sessions[sessionIndex].exercises[blockId]}
        />
      )}
    </>
  );
};

export default TrainingMenu;
