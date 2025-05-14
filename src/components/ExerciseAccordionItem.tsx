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

  const { name, seriesN, reps, effort, restTime, progression } = blockId
    ? (
        planState.sessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock
      ).selectedExercises.find((e) => e.id === id)
    : planState.sessions[sessionIndex].exercises.find((e) => e.id === id);

  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  const initialFormState = {
    seriesN: { value: seriesN, error: null },
    reps: { value: reps, error: null },
    effort: { value: effort, error: null },
    restTime: { value: restTime, error: null },
  };
  const [formState, setFormState] = useState(initialFormState);
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
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: { ...formState[name], value: value },
    });
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
    const { name, value } = e.target;
    const intValue = parseInt(value);
    if (name === "effort") {
      if (intValue > 10) {
        setFormState(initialFormState);
        return;
      }
    }
    if (intValue < 1) {
      setFormState(initialFormState);
      return;
    }
    if (name === "reps") {
      if (!validateReps(value, seriesN)) {
        setFormState(initialFormState);
        return;
      }
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
        exercise[name] = intValue;
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
        exercise[name] = intValue;
        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === id ? exercise : e));
      }
      return { ...prev, sessions: updatedSessions };
    });
  };

  const onProgressionBlur = (index: number, field: keyof Progression) => {
    const newProgression: Progression[] = [...displayProgression];
    const intValue =
      typeof newProgression[index][field] === "number"
        ? newProgression[index][field]
        : parseInt(newProgression[index][field]);
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
      if (
        !validateReps(
          newProgression[index][field],
          newProgression[index].series
        )
      ) {
        setDisplayProgression(formatProgression(progression));
        return;
      }
      newProgression[index][field] = newProgression[index][field];
    } else {
      newProgression[index][field] = Number(newProgression[index][field]);
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
          className={`text-xl text-center my-auto rounded-2xl w-16 mx-auto ${
            inputStyles.input
          } ${formState.seriesN.error ? inputStyles.error : ""}`}
          value={formState.seriesN.value}
          onChange={handleInputChange}
          onBlur={onInputBlur}
          name="seriesN"
          type="number"
        />
        <input
          className={`text-xl text-center my-auto rounded-2xl w-32 mx-auto ${
            inputStyles.input
          } ${formState.reps.error ? inputStyles.error : ""}`}
          value={formState.reps.value}
          onChange={handleInputChange}
          onBlur={onInputBlur}
          name="reps"
        />
        <input
          className={`text-xl text-center my-auto  rounded-2xl w-16 mx-auto ${
            inputStyles.input
          } ${formState.effort.error ? inputStyles.error : ""}`}
          value={formState.effort.value}
          onChange={handleInputChange}
          onBlur={onInputBlur}
          name="effort"
          type="number"
        />
        <input
          className={`text-xl text-center my-auto  rounded-2xl w-16 mx-auto ${
            inputStyles.input
          } ${formState.restTime.error ? inputStyles.error : ""}`}
          value={formState.restTime.value}
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
                  onBlur={() => onProgressionBlur(index, "series")}
                />
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input}`}
                  value={week.repetitions}
                  onChange={(e) =>
                    handleProgressionChange(
                      index,
                      "repetitions",
                      e.target.value
                    )
                  }
                  onBlur={() => onProgressionBlur(index, "repetitions")}
                />
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input}`}
                  type="number"
                  value={week.effort}
                  onChange={(e) =>
                    handleProgressionChange(index, "effort", e.target.value)
                  }
                  onBlur={() => onProgressionBlur(index, "effort")}
                />
                <input
                  className={`text-lg text-center rounded-2xl w-16 mx-auto border border-transparent ${inputStyles.input}`}
                  type="number"
                  value={restTime}
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
