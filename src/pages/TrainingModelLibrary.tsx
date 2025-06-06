import React, { useEffect, useRef, useState } from "react";
import { useBlur } from "../contexts/BlurContext";
import TonalButton from "../components/TonalButton";
import OutlinedButton from "../components/OutlinedButton";
import inputStyles from "../styles/inputStyles.module.css";
import { useNavigate } from "react-router-dom";
import TrainingModelCard from "../components/TrainingModelCard";
import { TrainingModel, defaultPlanState } from "../types/trainingPlan";
import { useNewPlan } from "../contexts/NewPlanContext";
import {
  getTrainingModels,
  deleteTrainingModel,
} from "../hooks/parseTrainingData";
import { useTrainingPlanSync } from "../hooks/useTrainingPlanSync";
import useBackspaceNavigation from "../hooks/useBackspaceNavigation";
function TrainingModelLibrary({
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
}) {
  const { isBlurred, setIsBlurred } = useBlur();
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { setModel, resetModelState, setIsNewModel } = useNewPlan();
  const { deleteTrainingModel: syncDeleteTrainingModel } =
    useTrainingPlanSync();
  const [loadedModels, setLoadedModels] = useState<TrainingModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<TrainingModel[]>();
  const [modelToDelete, setModelToDelete] = useState<TrainingModel | null>(
    null
  );

  const onClose = () => {
    customNavigate("back", "trainingModelLibrary", "library");
    setTimeout(() => {
      navigate("/library");
    }, 300);
  };
  const onDelete = async () => {
    try {
      // Delete from local database
      await deleteTrainingModel(modelToDelete.id);

      // Sync deletion to remote database
      await syncDeleteTrainingModel(modelToDelete.id);

      // Update UI state
      setLoadedModels(
        loadedModels.filter((model) => model.id !== modelToDelete.id)
      );
      setFilteredModels(
        filteredModels?.filter((model) => model.id !== modelToDelete.id)
      );
      setModelToDelete(null);
      setIsBlurred(false);
    } catch (error) {
      console.error("Error deleting training model:", error);
      // Optionally show user feedback here
    }
  };
  const onClick = (id: string) => {
    setModel(loadedModels.find((model) => model.id === id));
    setIsNewModel(false);
    customNavigate("forward", "trainingModelLibrary", "trainingModel");
    setTimeout(() => {
      navigate("/trainingModel");
    }, 300);
  };
  const handleFilter = () => {
    console.log("Filtrar");
  };

  useBackspaceNavigation(onClose);

  useEffect(() => {
    setFilteredModels(
      loadedModels.filter((model) =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  useEffect(() => {
    const loadModels = async () => {
      const models = await getTrainingModels();
      setLoadedModels(models);
      setFilteredModels(models);
    };
    loadModels();
  }, []);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          isBlurred && "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        <div className="my-10 w-4/5 flex justify-around items-center">
          <div className="w-[122px]" />
          <p className="text-3xl text-secondary">
            Biblioteca de Modelos de Entrenamiento
          </p>
          <OutlinedButton
            title="Crear Nuevo"
            onClick={() => {
              resetModelState();
              customNavigate(
                "forward",
                "trainingModelLibrary",
                "trainingModel"
              );
              setTimeout(() => {
                navigate("/trainingModel?new=true");
              }, 300);
            }}
            icon="addRed"
          />
          <TonalButton
            inverse
            title="Volver"
            icon="backWhite"
            onClick={onClose}
          />
        </div>

        <div className="self-end w-3/4 flex items-center">
          <div
            className={`w-3/5 h-16 rounded-2xl bg-white shadow-sm flex items-center px-4 ${
              searchBarFocus && inputStyles.focused
            }`}
          >
            <img src="/search.png" alt="Buscar" className="h-8 w-8 mr-8" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-full focus:outline-none text-lg bg-white text-darkGray"
              onFocus={() => setSearchBarFocus(true)}
              onBlur={() => setSearchBarFocus(false)}
              placeholder="Buscar modelos de entrenamiento..."
            />
          </div>
          <OutlinedButton
            title="Filtrar"
            onClick={handleFilter}
            containerStyles="ml-8"
            icon="filter"
            ref={filterButtonRef}
          />
        </div>
        <div className="grid grid-cols-3 gap-x-[5%] gap-y-16 w-full  px-36 mt-16">
          {filteredModels?.map((model) => (
            <TrainingModelCard
              key={model.id}
              model={model}
              onClick={() => {
                onClick(model.id);
              }}
              onDelete={() => {
                setModelToDelete(model);
                setIsBlurred(true);
              }}
            />
          ))}
        </div>
      </div>
      {modelToDelete && (
        <div
          className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-[500px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          <p className="text-darkGray text-lg my-8">
            Está seguro que desea eliminar el modelo de entrenamiento{" "}
            <span className="text-tertiary">{modelToDelete.name}</span>?
          </p>
          <div className="flex justify-around w-full mb-8">
            <OutlinedButton
              icon="back"
              onClick={() => {
                setModelToDelete(null);
                setIsBlurred(false);
              }}
              title="Volver"
              containerStyles="w-[35%]"
              inverse
            />
            <TonalButton
              icon="check"
              onClick={onDelete}
              title="Eliminar"
              containerStyles="w-[35%]"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default TrainingModelLibrary;
