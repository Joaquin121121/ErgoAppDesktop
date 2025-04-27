import React from "react";
import SeamlessLoopPlayer from "./SeamlessLoopPlayer";
import TonalButton from "./TonalButton";
import navAnimations from "../styles/animations.module.css";
import { useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import OutlinedButton from "./OutlinedButton";
import { useBlur } from "../contexts/BlurContext";
import { useNewPlan } from "../contexts/NewPlanContext";

interface TrainingPlanCreatorProps {
  isCreatingPlan: boolean;
  onToggleCreatingPlan: () => void;
  displayPopup: () => void;
}

const TrainingPlanCreator: React.FC<TrainingPlanCreatorProps> = ({
  isCreatingPlan,
  onToggleCreatingPlan,
  displayPopup,
}) => {
  const [formState, setFormState] = useState({
    nOfWeeks: { value: "", error: "" },
  });
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [useAsModel, setUseAsModel] = useState(false);

  const { planState, updateModelId } = useNewPlan();

  const { isBlurred, setIsBlurred } = useBlur();

  return (
    <div
      className={`bg-white rounded-2xl relative shadow-sm flex flex-col items-center transition-[width,opacity] duration-500 ease-in-out -ml-8 mr-16 ${
        isBlurred && "blur-md pointer-events-none"
      }`}
      style={{ width: isCreatingPlan ? "70%" : "40%" }}
    >
      {isCreatingPlan ? (
        <>
          <div
            className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={onToggleCreatingPlan}
          >
            <img src="/close.png" className="h-6 w-6" alt="" />
          </div>
          <div className="flex my-10 items-center justify-center gap-x-4">
            <p className="text-2xl text-secondary">
              Nuevo Plan de Entrenamiento
            </p>
            <img src="/trainingRed.png" className="h-8 w-8" alt="" />
          </div>
          <div className="flex flex-col pl-20 w-full">
            <p className=" text-lg mb-2">Duracion</p>
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
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    nOfWeeks: { value: e.target.value, error: "" },
                  })
                }
              />
              <p className="text-lg text-darkGray">semanas</p>
            </div>
            {planState.modelId.length > 0 ? (
              <div className="flex gap-x-8 mt-8 items-center">
                <p className="text-lg">
                  Usando modelo{" "}
                  <span className="text-secondary">{planState.modelId}</span>{" "}
                  como base
                </p>
                <p
                  className="text-secondary hover:opacity-70 active:opacity-40 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    updateModelId("");
                    displayPopup();
                  }}
                >
                  Cambiar modelo
                </p>
              </div>
            ) : (
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
              </>
            )}

            {useAsModel ? (
              <>
                <p className="mt-8 text-lg">Nombre del Modelo</p>
                <input
                  type="text"
                  className={`${
                    inputStyles.input
                  } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
                    validationAttempted &&
                    formState.nOfWeeks.error &&
                    inputStyles.focused
                  }`}
                />
              </>
            ) : (
              <OutlinedButton
                title="Usar Modelo Preexistente"
                onClick={displayPopup}
                containerStyles="mt-8 self-center"
                icon="modelRed"
              />
            )}
            <div className="flex justify-center items-center gap-x-8">
              <TonalButton
                title="Crear Plan"
                icon="add"
                containerStyles="self-center mt-4 mb-8"
                onClick={onToggleCreatingPlan}
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
            onClick={onToggleCreatingPlan}
          />
        </>
      )}
    </div>
  );
};

export default TrainingPlanCreator;
