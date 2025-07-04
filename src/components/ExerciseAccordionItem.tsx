import {
  DisplayProgression,
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
  isModel?: boolean;
}

const ExerciseAccordionItem: React.FC<ExerciseAccordionItemProps> = ({
  id,
  sessionIndex,
  currentWeek,
  blockId,
  last = false,
  isModel = false,
}) => {
  const {
    planState,
    model,
    removeExercise,
    saveSelectedExercise,
    updateProgression,
    updateSelectedExercise,
  } = useNewPlan();

  const currentPlan = isModel ? model : planState;

  const { name, series, repetitions, effort, restTime, progression } = blockId
    ? (
        currentPlan.sessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock
      ).selectedExercises.find((e) => e.id === id)
    : currentPlan.sessions[sessionIndex].exercises.find((e) => e.id === id);

  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);
  const [interimRestTime, setInterimRestTime] = useState(restTime);
  const [displayProgression, setDisplayProgression] = useState<
    DisplayProgression[]
  >([]);

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
    field: keyof DisplayProgression,
    value: string
  ) => {
    const newProgression: DisplayProgression[] = [...displayProgression];
    newProgression[index][field] = value;
    setDisplayProgression(newProgression);
  };

  const onInputBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const intValue = parseInt(value);

    if (intValue < 0) {
      setInterimRestTime(restTime);
      return;
    }

    let exercise: SelectedExercise;
    exercise = blockId
      ? ((
          currentPlan.sessions[sessionIndex].exercises.find(
            (e) => e.id === blockId
          ) as TrainingBlock
        ).selectedExercises.find((e) => e.id === id) as SelectedExercise)
      : (currentPlan.sessions[sessionIndex].exercises.find(
          (e) => e.id === id
        ) as SelectedExercise);

    exercise.restTime = intValue;

    await updateSelectedExercise(sessionIndex, id, exercise, blockId, isModel);

    setInterimRestTime(intValue);
  };

  const onProgressionBlur = async (
    index: number,
    field: keyof DisplayProgression,
    value: string
  ) => {
    const newProgression: DisplayProgression[] = [...displayProgression];
    const intValue = typeof value === "number" ? value : parseInt(value);

    if (field === "effort") {
      if (intValue > 10 || isNaN(intValue)) {
        setDisplayProgression(formatProgression(progression));
        return;
      }
    }
    if (intValue < 1 || isNaN(intValue)) {
      setDisplayProgression(formatProgression(progression));
      return;
    }

    if (field === "repetitions") {
      if (!validateReps(value, newProgression[index].series)) {
        setDisplayProgression(formatProgression(progression));
        return;
      }
    }
    newProgression[index][field] = value;
    const formattedProgression: Progression = {
      id: progression[index].id,
      series: parseInt(newProgression[index].series),
      repetitions: newProgression[index].repetitions,
      effort: parseInt(newProgression[index].effort),
    };

    await updateProgression(
      sessionIndex,
      id,
      index,
      formattedProgression,
      isModel,
      blockId
    );

    setDisplayProgression(newProgression);
  };

  useEffect(() => {
    setDisplayProgression(formatProgression(progression));
  }, [progression]);

  useEffect(() => {
    setInterimRestTime(restTime);
  }, [restTime]);

  return (
    <>
      {/* Header - Always visible */}
      <div
        className={` grid grid-cols-13 gap-x-4   ${
          blockId
            ? `w-full ${!last && "border-b border-gray"}`
            : "mt-4 border border-lightRed w-full rounded-2xl"
        }`}
      >
        <p className="col-span-3 text-xl text-center my-auto py-2 rounded-2xl mx-auto">
          {name}
        </p>
        <input
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${inputStyles.input} col-span-2`}
          value={displayProgression[currentWeek]?.series}
          onChange={(e) =>
            handleProgressionChange(currentWeek, "series", e.target.value)
          }
          onBlur={(e) =>
            onProgressionBlur(currentWeek, "series", e.target.value)
          }
          type="number"
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-32 mx-auto ${inputStyles.input} col-span-2`}
          value={displayProgression[currentWeek]?.repetitions}
          onChange={(e) =>
            handleProgressionChange(currentWeek, "repetitions", e.target.value)
          }
          onBlur={(e) =>
            onProgressionBlur(currentWeek, "repetitions", e.target.value)
          }
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${inputStyles.input} col-span-2`}
          value={displayProgression[currentWeek]?.effort}
          onChange={(e) =>
            handleProgressionChange(currentWeek, "effort", e.target.value)
          }
          onBlur={(e) =>
            onProgressionBlur(currentWeek, "effort", e.target.value)
          }
          type="number"
          min={1}
          max={10}
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${inputStyles.input} col-span-2`}
          value={interimRestTime}
          onChange={handleInputChange}
          onBlur={onInputBlur}
          name="restTime"
          type="number"
          min={1}
        />
        <div
          className="flex flex-grow justify-center items-center"
          onClick={(e) => {
            e.stopPropagation();
            removeExercise(sessionIndex, id, blockId, isModel);
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
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div className="py-4 border-l border-r border-b border-lightRed rounded-b-2xl">
          {/* Progress data in grid format */}
          <div className="grid grid-cols-13 gap-x-4 gap-y-4">
            {displayProgression.map((week, index) => (
              <React.Fragment key={index}>
                <p
                  className={`text-center col-span-3 my-auto text-lg ${
                    currentWeek === index ? "text-secondary" : "text-darkGray"
                  }`}
                >
                  Semana {index + 1}
                </p>
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input} col-span-2`}
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
                  className={`text-lg text-center rounded-2xl w-32 mx-auto border border-transparent ${inputStyles.input} col-span-2`}
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
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input} col-span-2`}
                  type="number"
                  value={week.effort}
                  onChange={(e) =>
                    handleProgressionChange(index, "effort", e.target.value)
                  }
                  onBlur={(e) =>
                    onProgressionBlur(index, "effort", e.target.value)
                  }
                  min={1}
                  max={10}
                />
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input} col-span-2`}
                  type="number"
                  value={interimRestTime}
                  name="restTime"
                  onChange={handleInputChange}
                  onBlur={onInputBlur}
                  min={1}
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
