import React, { useState } from "react";
import navAnimations from "../styles/animations.module.css";
import { TrainingBlock } from "../types/trainingPlan";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "./TonalButton";
import { useNewPlan } from "../contexts/NewPlanContext";

function EditBlockPopup({
  onClose,
  trainingBlock,
}: {
  onClose: () => void;
  trainingBlock: TrainingBlock;
}) {
  const { updateTrainingBlock } = useNewPlan();
  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);
  const [blockModel, setBlockModel] = useState<"sequential" | "series">(
    trainingBlock.blockModel
  );
  const [trainingBlockName, setTrainingBlockName] = useState(
    trainingBlock.name
  );
  const localOnClose = () => {
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      onClose();
    }, 200);
  };
  const handleSave = async () => {
    const updatedTrainingBlock = {
      ...trainingBlock,
      name: trainingBlockName,
      blockModel: blockModel,
    };

    await updateTrainingBlock(updatedTrainingBlock, true);

    localOnClose();
  };
  return (
    <div
      className={`absolute flex flex-col items-center top-8 left-1/2 transform -translate-x-1/2 bg-white shadow-sm rounded-2xl ${animation} w-1/2`}
    >
      <div
        className="absolute z-50 hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localOnClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <p className="text-2xl mt-8">
        Editar Bloque:{" "}
        <span className="text-secondary">{trainingBlock.name}</span>
      </p>
      <div className="flex flex-col pl-20 w-full">
        <p className=" text-lg mt-8">Nombre del evento</p>
        <input
          type="text"
          className={`${inputStyles.input} bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary  `}
          value={trainingBlockName}
          onChange={(e) => setTrainingBlockName(e.target.value)}
        />
        <div className="flex gap-x-8 mt-8 mb-2 items-center">
          <p className="text-darkGray text-lg">Modo de Ejecución</p>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              blockModel === "sequential"
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setBlockModel("sequential")}
          >
            Secuencial
          </button>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              blockModel === "series"
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setBlockModel("series")}
          >
            En Serie
          </button>
        </div>
      </div>
      <TonalButton
        containerStyles="my-12"
        icon="next"
        title="Guardar"
        onClick={handleSave}
      />
    </div>
  );
}

export default EditBlockPopup;
