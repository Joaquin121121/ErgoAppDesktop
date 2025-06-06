import React, { useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "./TonalButton";
import LoadManagement from "./LoadManagement";
import { Exercise } from "../types/trainingPlan";
import { useNewPlan } from "../contexts/NewPlanContext";
import navAnimations from "../styles/animations.module.css";
import { validateReps } from "../utils/utils";

function ExerciseData({
  animation,
  selectedExercises,
  onContinue,
  sessionIndex,
  isModel = false,
}: {
  animation: string;
  selectedExercises: Exercise[];
  onContinue: () => void;
  sessionIndex: number;
  isModel?: boolean;
}) {
  const {
    setCurrentSelectedExercise,
    currentSelectedExercise,
    planState,
    model,
  } = useNewPlan();
  const [showInfoAnimation, setShowInfoAnimation] = useState(
    navAnimations.popupFadeInTop
  );

  const currentPlan = isModel ? model : planState;

  const nOfTrainingBlocks = currentPlan.sessions[sessionIndex].exercises.filter(
    (exercise) => exercise.type === "trainingBlock"
  ).length;
  const exerciseName =
    selectedExercises.length === 1 && selectedExercises[0].name;

  const [showInfo, setShowInfo] = useState(false);

  const [formState, setFormState] = useState({
    comments: {
      value: "",
      error: "",
    },
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
      value: `Bloque ${nOfTrainingBlocks + 1}`,
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

    setCurrentSelectedExercise({
      ...currentSelectedExercise,
      type: "selectedExercise",
      series: parseInt(formState.series.value),
      repetitions: formState.repetitions.value,
      effort: parseInt(formState.effort.value),
      exerciseId: selectedExercises[0].id,
      name: exerciseName || formState.name.value,
      restTime: parseInt(formState.restTime.value),
      comments: formState.comments.value,
    });
    onContinue();
  };

  const closeInfoPopup = () => {
    setShowInfoAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowInfo(false);
      setShowInfoAnimation(navAnimations.popupFadeInTop);
    }, 200);
  };

  return (
    <>
      {showInfo && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 w-[40vw] z-50 flex flex-col items-center shadow-sm rounded-2xl bg-white h-auto p-16 ${showInfoAnimation}`}
        >
          <div
            className="absolute z-50 hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={closeInfoPopup}
          >
            <img src="/close.png" className="h-6 w-6" alt="" />
          </div>
          <p className="text-xl mb-4">
            Qué es el{" "}
            <span className="text-secondary font-medium">
              Carácter del Esfuerzo?
            </span>
          </p>
          <p className="text-lg">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Vitae ipsa
            sequi, provident voluptatum aliquam recusandae accusamus veniam
            rerum iste expedita nihil corporis nemo maxime fugiat earum non
            velit dolorum facere.
          </p>
          <TonalButton
            containerStyles="self-center mt-8 mb-4"
            title="Continuar"
            icon="next"
            onClick={closeInfoPopup}
          />
        </div>
      )}

      <div
        className={`flex flex-col items-center w-[50vw] ${animation} ${
          showInfo && "blur-md pointer-events none"
        }`}
      >
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
                value={formState.name.value}
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
              type="text"
              className={`w-28 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
                inputStyles.input
              } ${formState.repetitions.error && inputStyles.focused}`}
              onChange={(e) => {
                if (
                  isNaN(parseInt(e.target.value)) ||
                  parseInt(e.target.value) >= 0
                ) {
                  setFormState({
                    ...formState,
                    repetitions: { value: e.target.value, error: "" },
                  });
                }
              }}
              value={formState.repetitions.value}
              onBlur={(e) => {
                if (
                  !validateReps(
                    e.target.value,
                    parseInt(formState.series.value)
                  )
                ) {
                  setFormState({
                    ...formState,
                    repetitions: {
                      value: "",
                      error: "invalidFormat",
                    },
                  });
                }
              }}
            />
            <p className="text-darkGray ">
              Use un guión (-) para indicar un rango de repeticiones &nbsp;
              <br />
              Use una barra (/) para indicar cuantas repeticiones se harán por
              serie
            </p>
          </div>
          {formState.repetitions.error === "invalidFormat" && (
            <p className="mt-2 text-sm text-secondary">
              Formato no valido (ingrese un unico valor, un rango separado por
              '-' o una variacion intraserie separada por '/')
            </p>
          )}
          <p className="text-darkGray text-lg mt-8 mb-2">
            Carácter del Esfuerzo
          </p>

          <div className="flex items-center">
            <input
              type="number"
              className={`w-28 h-10 rounded-2xl bg-offWhite shadow-sm px-4 focus:outline-none ${
                inputStyles.input
              } ${formState.effort.error && inputStyles.focused}`}
              onChange={(e) => {
                if (
                  (parseInt(e.target.value) > 0 &&
                    parseInt(e.target.value) <= 10) ||
                  e.target.value === ""
                ) {
                  setFormState({
                    ...formState,
                    effort: { value: e.target.value, error: "" },
                  });
                }
              }}
              value={formState.effort.value}
            />
            <div
              className="flex items-center hover:opacity-70 active:opacity-40 transition-all duration-200 cursor-pointer"
              onClick={() => {
                setShowInfo(true);
              }}
            >
              <p className="text-secondary ml-8 mr-2 ">Más Info</p>
              <img src="/info.png" alt="" className="h-5 w-5 " />
            </div>
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
          <p className="text-darkGray text-lg mt-8 mb-2">Observaciones</p>
          <textarea
            className={`w-[90%] rounded-2xl bg-offWhite shadow-sm px-4 py-2 h-20 focus:outline-none ${inputStyles.input}`}
            value={formState.comments.value}
            onChange={(e) => {
              setFormState({
                ...formState,
                comments: { value: e.target.value, error: "" },
              });
            }}
          />
        </div>
        <TonalButton
          containerStyles="self-center mt-8 mb-4"
          title="Continuar"
          icon="next"
          onClick={onSave}
        />
      </div>
    </>
  );
}

export default ExerciseData;
