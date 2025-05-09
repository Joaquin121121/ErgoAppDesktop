import React, { useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "./TonalButton";
import LoadManagement from "./LoadManagement";
import { Exercise } from "../types/trainingPlan";
import { useNewPlan } from "../contexts/NewPlanContext";

function ExerciseData({
  animation,
  selectedExercises,
  onContinue,
  sessionIndex,
}: {
  animation: string;
  selectedExercises: Exercise[];
  onContinue: () => void;
  sessionIndex: number;
}) {
  const { setCurrentSelectedExercise, currentSelectedExercise } = useNewPlan();
  const exerciseName =
    selectedExercises.length === 1 && selectedExercises[0].name;

  const [formState, setFormState] = useState({
    series: {
      value: "",
      error: "",
    },
    repetitions: {
      value: "",
      error: "",
    },
    effort: {
      value: "",
      error: "",
    },
    restTime: {
      value: "",
      error: "",
    },
    name: {
      value: "",
      error: "",
    },
  });

  const onSave = () => {
    if (formState.restTime.value === "") {
      setFormState({
        ...formState,
        restTime: { value: formState.restTime.value, error: "required" },
      });
      return;
    }
    if (formState.series.value === "") {
      setFormState({
        ...formState,
        series: { value: formState.series.value, error: "required" },
      });
      return;
    }
    if (formState.repetitions.value === "") {
      setFormState({
        ...formState,
        repetitions: { value: formState.repetitions.value, error: "required" },
      });
      return;
    }
    if (formState.effort.value === "") {
      setFormState({
        ...formState,
        effort: { value: formState.effort.value, error: "required" },
      });
      return;
    }

    if (exerciseName) {
      setCurrentSelectedExercise({
        ...currentSelectedExercise,
        type: "selectedExercise",
        seriesN: parseInt(formState.series.value),
        reps: formState.repetitions.value,
        effort: parseInt(formState.effort.value),
        exerciseId: selectedExercises[0].id,
        name: exerciseName,
        restTime: parseInt(formState.restTime.value),
      });
    }
    onContinue();
  };

  return (
    <div className={`flex flex-col items-center w-[50vw] ${animation}`}>
      <p className="text-secondary text-2xl mt-8">
        Añadir {exerciseName ? "Ejercicio: " : "Bloque de Ejercicios"}
        {exerciseName && (
          <span className="text-tertiary">
            {exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1)}
          </span>
        )}
      </p>
      <div className="flex flex-col pl-20 w-full">
        {!exerciseName && (
          <>
            <p className="text-darkGray text-lg mt-8 mb-2">Nombre</p>
            <input
              type="text"
              className={`w-80 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
                inputStyles.input
              } ${formState.name.error && inputStyles.focused}`}
              onChange={(e) => {
                setFormState({
                  ...formState,
                  name: { value: e.target.value, error: "" },
                });
              }}
            />
          </>
        )}
        <p className="text-darkGray text-lg mt-8 mb-2">Series</p>
        <input
          type="number"
          className={`w-28 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
            inputStyles.input
          } ${formState.series.error && inputStyles.focused}`}
          onChange={(e) => {
            if (parseInt(e.target.value) > 0 || e.target.value === "") {
              setFormState({
                ...formState,
                series: { value: e.target.value, error: "" },
              });
            }
          }}
          value={formState.series.value}
        />
        <p className="text-darkGray text-lg mt-8 mb-2">Repeticiones</p>
        <div className="flex items-center gap-x-8">
          <input
            type="number"
            className={`w-28 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
              inputStyles.input
            } ${formState.repetitions.error && inputStyles.focused}`}
            onChange={(e) => {
              if (parseInt(e.target.value) > 0 || e.target.value === "") {
                setFormState({
                  ...formState,
                  repetitions: { value: e.target.value, error: "" },
                });
              }
            }}
            value={formState.repetitions.value}
          />
          <p className="text-darkGray ">
            Use un guión (-) para separar repeticiones por serie
          </p>
        </div>
        <p className="text-darkGray text-lg mt-8 mb-2">Carácter del Esfuerzo</p>

        <div className="flex items-center">
          <input
            type="number"
            className={`w-28 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
              inputStyles.input
            } ${formState.effort.error && inputStyles.focused}`}
            onChange={(e) => {
              if (parseInt(e.target.value) > 0 || e.target.value === "") {
                setFormState({
                  ...formState,
                  effort: { value: e.target.value, error: "" },
                });
              }
            }}
            value={formState.effort.value}
          />
          <p className="text-secondary ml-8 mr-2 hover:opacity-70 active:opacity-40 transition-all duration-200 cursor-pointer">
            Más Info
          </p>
          <img
            src="/info.png"
            alt=""
            className="h-5 w-5 hover:opacity-70 active:opacity-40 transition-all duration-200 cursor-pointer"
          />
        </div>
        <p className="text-darkGray text-lg mt-8 mb-2">Descanso</p>

        <div className="flex items-center">
          <input
            type="number"
            className={`w-28 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
              inputStyles.input
            } ${formState.restTime.error && inputStyles.focused}`}
            onChange={(e) => {
              if (parseInt(e.target.value) > 0 || e.target.value === "") {
                setFormState({
                  ...formState,
                  restTime: { value: e.target.value, error: "" },
                });
              }
            }}
            value={formState.restTime.value}
          />
          <p className=" ml-4">segundos</p>
        </div>
      </div>
      <TonalButton
        containerStyles="self-center mt-8 mb-4"
        title="Continuar"
        icon="next"
        onClick={onSave}
      />
    </div>
  );
}

export default ExerciseData;
