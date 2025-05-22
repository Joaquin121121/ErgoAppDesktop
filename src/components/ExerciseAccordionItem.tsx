import {
  Progression,
  SelectedExercise,
  TrainingBlock,
} from "../types/trainingPlan";
import React, { useState, useRef, useEffect } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import { useNewPlan } from "../contexts/NewPlanContext";
import { formatProgression, validateReps } from "../utils/utils";

interface ExerciseAccordionItemProps {
  id: string;
  sessionIndex: number;
  currentWeek: number;
  blockId?: string;
  last?: boolean;
}

const ExerciseAccordionItem: React.FC<ExerciseAccordionItemProps> = ({
  id,
  sessionIndex,
  currentWeek,
  blockId,
  last = false,
}) => {
  const { planState, setPlanState, removeExercise } = useNewPlan();

  const { name, series, repetitions, effort, restTime, progression } = blockId
    ? (
        planState.sessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock
      ).selectedExercises.find((e) => e.id === id)
    : planState.sessions[sessionIndex].exercises.find((e) => e.id === id);

  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);
  const [interimRestTime, setInterimRestTime] = useState(restTime);
  const [displayProgression, setDisplayProgression] = useState([]);

  useEffect(() => {
    if (isExpanded) {
      const updateHeight = () => {
        const contentHeight = contentRef.current?.scrollHeight;
        setHeight(contentHeight);
      };

      // Update height initially
      updateHeight();

      // Set up a ResizeObserver to detect content size changes
      const resizeObserver = new ResizeObserver(() => {
        if (isExpanded) {
          updateHeight();
        }
      });

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => {
        if (contentRef.current) {
          resizeObserver.unobserve(contentRef.current);
        }
        resizeObserver.disconnect();
      };
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "restTime") {
      setInterimRestTime(Number(e.target.value));
    }
  };

  const handleProgressionChange = (
    index: number,
    field: keyof Progression,
    value: string
  ) => {
    const newProgression: Progression[] = [...displayProgression];

    if (field === "repetitions") {
      newProgression[index][field] = value;
    } else {
      newProgression[index][field] = parseInt(value);
    }
    setDisplayProgression(newProgression);
  };

  const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.name !== "restTime") return;

    const value = e.target.value;
    const intValue = parseInt(value);

    if (intValue < 1) {
      setInterimRestTime(restTime);
      return;
    }

    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      if (blockId) {
        const block = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock;
        if (!block) return prev;
        const exercise = block.selectedExercises.find(
          (e) => e.id === id
        ) as SelectedExercise;
        if (!exercise) return prev;
        exercise["restTime"] = intValue;
        block.selectedExercises = block.selectedExercises.map((e) =>
          e.id === id ? exercise : e
        );
        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === blockId ? block : e));
      } else {
        const exercise = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === id
        );
        if (!exercise) return prev;
        exercise["restTime"] = intValue;
        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === id ? exercise : e));
      }
      return { ...prev, sessions: updatedSessions };
    });
  };

  const onProgressionBlur = (
    index: number,
    field: keyof Progression,
    value: string
  ) => {
    const newProgression: Progression[] = [...displayProgression];
    const intValue = typeof value === "number" ? value : parseInt(value);
    if (field === "effort") {
      if (intValue > 10) {
        setDisplayProgression(formatProgression(progression));
        return;
      }
    }
    if (intValue < 1) {
      setDisplayProgression(formatProgression(progression));
      return;
    }

    if (field === "repetitions") {
      if (!validateReps(value, newProgression[index].series)) {
        setDisplayProgression(formatProgression(progression));
        return;
      }
      newProgression[index][field] = value;
    } else {
      newProgression[index][field] = intValue;
    }
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      if (blockId) {
        const block = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock;
        if (!block) return prev;
        const exercise = block.selectedExercises.find(
          (e) => e.id === id
        ) as SelectedExercise;
        if (!exercise) return prev;
        if (field === "repetitions") {
          exercise.progression[index][field] = newProgression[index][field];
        } else {
          exercise.progression[index][field] = newProgression[index][field];
        }
        block.selectedExercises = block.selectedExercises.map((e) =>
          e.id === id ? exercise : e
        );
        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === blockId ? block : e));
      } else {
        const exercise = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === id
        );
        if (!exercise) return prev;
        if (field === "repetitions") {
          exercise.progression[index][field] = newProgression[index][field];
        } else {
          exercise.progression[index][field] = newProgression[index][field];
        }
        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === id ? exercise : e));
      }
      return { ...prev, sessions: updatedSessions };
    });
    setDisplayProgression(newProgression);
  };

  useEffect(() => {
    setDisplayProgression(formatProgression(progression));
  }, [progression]);

  useEffect(() => {
    setInterimRestTime(restTime);
  }, [restTime]);

  useEffect(() => {
    console.log(
      "Session:",
      planState.sessions[sessionIndex].exercises.find(
        (e) => e.id === blockId
      ) as TrainingBlock
    );
  }, [
    planState.sessions[sessionIndex].exercises.find(
      (e) => e.id === blockId
    ) as TrainingBlock,
  ]);
  return (
    <>
      {/* Header - Always visible */}
      <div
        className={`mx-auto grid grid-cols-8 gap-x-4   ${
          blockId
            ? `w-full ${!last && "border-b border-gray"}`
            : "mt-4 border border-lightRed w-[90%] rounded-2xl"
        }`}
      >
        <p className="col-span-2 text-xl text-center my-auto py-2 rounded-2xl mx-auto">
          {name}
        </p>
        <input
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${inputStyles.input}`}
          value={displayProgression[currentWeek]?.series || series}
          onChange={(e) =>
            handleProgressionChange(currentWeek, "series", e.target.value)
          }
          onBlur={(e) =>
            onProgressionBlur(currentWeek, "series", e.target.value)
          }
          type="number"
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-32 mx-auto ${inputStyles.input}`}
          value={displayProgression[currentWeek]?.repetitions || repetitions}
          onChange={(e) =>
            handleProgressionChange(currentWeek, "repetitions", e.target.value)
          }
          onBlur={(e) =>
            onProgressionBlur(currentWeek, "repetitions", e.target.value)
          }
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${inputStyles.input}`}
          value={displayProgression[currentWeek]?.effort || effort}
          onChange={(e) =>
            handleProgressionChange(currentWeek, "effort", e.target.value)
          }
          onBlur={(e) =>
            onProgressionBlur(currentWeek, "effort", e.target.value)
          }
          type="number"
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${inputStyles.input}`}
          value={interimRestTime}
          onChange={handleInputChange}
          onBlur={onInputBlur}
          name="restTime"
          type="number"
        />
        <div
          className="flex flex-grow justify-center items-center"
          onClick={(e) => {
            e.stopPropagation();
            removeExercise(sessionIndex, id, blockId);
          }}
        >
          <img
            src="/close.png"
            alt=""
            className="h-7 w-7 my-2 hover:opacity-70 hover:cursor-pointer active:opacity-40 transition-all duration-200 cursor-pointer"
          />
        </div>
        <div
          className="flex justify-center items-center"
          onClick={handleToggle}
        >
          <img
            src="/arrowDown.png"
            alt=""
            className={`h-12 w-12 my-2 hover:opacity-70 hover:cursor-pointer active:opacity-40 transition-all duration-200 cursor-pointer ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expandable content */}
      <div
        ref={contentRef}
        style={{
          height: height !== undefined ? `${height}px` : "auto",
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
          width: blockId ? "100%" : "90%",
          margin: "0 auto",
        }}
      >
        <div className="py-4 border-l border-r border-b border-lightRed rounded-b-2xl">
          {/* Progress data in grid format */}
          <div className="grid grid-cols-8 gap-x-4 gap-y-4">
            {displayProgression.map((week, index) => (
              <React.Fragment key={index}>
                <p
                  className={`text-center col-span-2 my-auto text-lg ${
                    currentWeek === index ? "text-secondary" : "text-darkGray"
                  }`}
                >
                  Semana {index + 1}
                </p>
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input}`}
                  type="number"
                  value={week.series}
                  onChange={(e) =>
                    handleProgressionChange(index, "series", e.target.value)
                  }
                  onBlur={(e) =>
                    onProgressionBlur(index, "series", e.target.value)
                  }
                />
                <input
                  className={`text-lg text-center rounded-2xl w-32 mx-auto border border-transparent ${inputStyles.input}`}
                  value={week.repetitions}
                  onChange={(e) =>
                    handleProgressionChange(
                      index,
                      "repetitions",
                      e.target.value
                    )
                  }
                  onBlur={(e) =>
                    onProgressionBlur(index, "repetitions", e.target.value)
                  }
                />
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input}`}
                  type="number"
                  value={week.effort}
                  onChange={(e) =>
                    handleProgressionChange(index, "effort", e.target.value)
                  }
                  onBlur={(e) =>
                    onProgressionBlur(index, "effort", e.target.value)
                  }
                />
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input}`}
                  type="number"
                  value={interimRestTime}
                  name="restTime"
                  onChange={handleInputChange}
                  onBlur={onInputBlur}
                />
                <div></div>
                <div></div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExerciseAccordionItem;
