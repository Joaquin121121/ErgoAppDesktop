import React, { useEffect } from "react";
import SeamlessLoopPlayer from "./SeamlessLoopPlayer";
import TonalButton from "./TonalButton";
import navAnimations from "../styles/animations.module.css";
import { useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import OutlinedButton from "./OutlinedButton";
import { useNewPlan } from "../contexts/NewPlanContext";

interface TrainingPlanCreatorProps {
  isCreatingPlan: boolean;
  onNext: () => void;
  displayPopup: () => void;
  animation: string;
  handleToggleCreatingPlan: () => void;
  isModel?: boolean;
}

const TrainingPlanCreator: React.FC<TrainingPlanCreatorProps> = ({
  isCreatingPlan,
  onNext,
  displayPopup,
  animation,
  handleToggleCreatingPlan,
  isModel = false,
}) => {
  const [formState, setFormState] = useState({
    nOfWeeks: { value: "", error: "" },
    modelName: { value: "", error: "" },
    modelDescription: { value: "", error: "" },

    nOfSessions: { value: "", error: "" },
  });
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [useAsModel, setUseAsModel] = useState(false);

  const {
    planState,
    model,
    updateNOfSessions,
    updateWeeks,
    updateModelDescription,
    updateModelName,
  } = useNewPlan();

  const currentPlan = isModel ? model : planState;

  const localOnNext = () => {
    setValidationAttempted(true);
    if (isModel) {
      if (formState.modelName.value === "") {
        setFormState({
          ...formState,
          modelName: {
            value: "",
            error: "El nombre del modelo no puede estar vacío",
          },
        });
        return;
      }
      if (formState.modelDescription.value === "") {
        setFormState({
          ...formState,
          modelDescription: {
            value: "",
            error: "La descripcion del modelo no puede estar vacía",
          },
        });
        return;
      }
    }
    if (
      parseInt(formState.nOfWeeks.value) === 0 ||
      formState.nOfWeeks.value === ""
    ) {
      setFormState({
        ...formState,
        nOfWeeks: { value: "", error: "El numero de semanas no puede ser 0" },
      });
      return;
    }
    if (
      parseInt(formState.nOfSessions.value) === 0 ||
      formState.nOfSessions.value === ""
    ) {
      setFormState({
        ...formState,
        nOfSessions: {
          value: "",
          error: "El numero de sesiones no puede ser 0",
        },
      });
      return;
    }
    if (useAsModel && formState.modelName.value === "") {
      setFormState({
        ...formState,
        modelName: {
          value: "",
          error: "El nombre del modelo no puede estar vacío",
        },
      });
      return;
    }
    updateNOfSessions(parseInt(formState.nOfSessions.value), isModel);
    updateWeeks(parseInt(formState.nOfWeeks.value), isModel);
    if (isModel) {
      updateModelDescription(formState.modelDescription.value);
      updateModelName(formState.modelName.value);
    }
    onNext();
  };

  return (
    <div className={`flex flex-col items-center ${animation}`}>
      {isCreatingPlan ? (
        <>
          {!isModel && (
            <div className="flex mt-10 items-center justify-center gap-x-4 ">
              <p className="text-2xl text-secondary">
                Nuevo Plan de Entrenamiento
              </p>
              <img src="/trainingRed.png" className="h-8 w-8" alt="" />
            </div>
          )}

          <div className="flex flex-col mt-10 pl-20 w-full">
            {isModel && (
              <>
                <p className=" text-lg mb-2">Nombre del Modelo</p>
                <input
                  type="text"
                  className={`${
                    inputStyles.input
                  } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
                    validationAttempted &&
                    formState.modelName.error &&
                    inputStyles.focused
                  } `}
                  value={formState.modelName.value}
                  onChange={(e) => {
                    setFormState({
                      ...formState,
                      modelName: { value: e.target.value, error: "" },
                    });
                  }}
                />
              </>
            )}
            <p className=" text-lg mt-8 mb-2">Duracion</p>
            <div className="flex gap-x-4 items-center">
              <input
                type="number"
                className={`${
                  inputStyles.input
                } bg-offWhite rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${
                  validationAttempted &&
                  formState.nOfWeeks.error &&
                  inputStyles.focused
                } `}
                value={formState.nOfWeeks.value}
                onChange={(e) => {
                  if (parseInt(e.target.value) > 0 || e.target.value === "") {
                    setFormState({
                      ...formState,
                      nOfWeeks: { value: e.target.value, error: "" },
                    });
                  }
                }}
              />
              <p className="text-lg text-darkGray">semanas</p>
            </div>

            {!isModel && (
              <>
                <p className="mt-8 text-lg">Usar como modelo?</p>
                <div className="flex gap-x-8 mt-2">
                  <button
                    className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                      useAsModel
                        ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                        : ""
                    }`}
                    onClick={() => setUseAsModel(true)}
                  >
                    Sí
                  </button>
                  <button
                    className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                      !useAsModel
                        ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                        : ""
                    }`}
                    onClick={() => setUseAsModel(false)}
                  >
                    No
                  </button>
                </div>
                <p
                  className="mt-4 text-secondary hover:opacity-70 active:opacity-40 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    displayPopup();
                  }}
                >
                  Seleccionar modelo base
                </p>
              </>
            )}

            {useAsModel && (
              <>
                <p className="mt-8 text-lg">Nombre del Modelo</p>
                <input
                  type="text"
                  className={`${
                    inputStyles.input
                  } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
                    validationAttempted &&
                    formState.modelName.error &&
                    inputStyles.focused
                  }`}
                  onChange={(e) => {
                    setFormState({
                      ...formState,
                      modelName: { value: e.target.value, error: "" },
                    });
                  }}
                />
              </>
            )}
            <p className=" text-lg mb-2 mt-8">Numero de sesiones</p>
            <div className="flex gap-x-4 items-center">
              <input
                type="number"
                className={`${
                  inputStyles.input
                } bg-offWhite rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${
                  validationAttempted &&
                  formState.nOfSessions.error &&
                  inputStyles.focused
                } `}
                value={formState.nOfSessions.value}
                onChange={(e) => {
                  if (parseInt(e.target.value) > 0 || e.target.value === "") {
                    setFormState({
                      ...formState,
                      nOfSessions: { value: e.target.value, error: "" },
                    });
                  }
                }}
              />
              <p className="text-lg text-darkGray">sesiones</p>
            </div>
            {isModel && (
              <>
                <p className=" text-lg mt-8 mb-2">Descripcion del Modelo</p>
                <textarea
                  className={`${inputStyles.input} bg-offWhite rounded-2xl shadow-sm pl-2 w-3/4 h-20 text-tertiary pt-2`}
                  value={formState.modelDescription.value}
                  onChange={(e) => {
                    setFormState({
                      ...formState,
                      modelDescription: { value: e.target.value, error: "" },
                    });
                  }}
                />
              </>
            )}
            {!useAsModel && !isModel && (
              <OutlinedButton
                title="Usar Modelo Preexistente"
                onClick={displayPopup}
                containerStyles="mt-8 self-center"
                icon="modelRed"
              />
            )}
            <div className="flex justify-center items-center gap-x-8">
              <TonalButton
                title={"Crear " + (isModel ? "Modelo" : "Plan")}
                icon="add"
                containerStyles="self-center mt-8 mb-8"
                onClick={localOnNext}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-x-8 mt-8">
            <p className="text-secondary text-2xl">Plan de Entrenamiento</p>
            <img src="/trainingRed.png" alt="" className="h-8 w-8" />
          </div>
          <SeamlessLoopPlayer
            src="/studying.mov"
            height={400}
            width={400}
            loop
            timeBetweenReplays={3}
          />
          <p className="text-xl mt-16 mb-8">No hay ningun plan cargado...</p>
          <TonalButton
            title="Crear Plan"
            icon="add"
            containerStyles="self-center mb-8"
            onClick={handleToggleCreatingPlan}
          />
        </>
      )}
    </div>
  );
};

export default TrainingPlanCreator;
