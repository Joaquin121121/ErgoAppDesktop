import React, { useState, useEffect } from "react";
import navAnimations from "../styles/animations.module.css";
import OutlinedButton from "./OutlinedButton";
import inputStyles from "../styles/inputStyles.module.css";
import { useNewPlan } from "../contexts/NewPlanContext";
function ModelChoicePopup({
  closePopup,
  externalClose,
  isModel = false,
}: {
  closePopup: () => void;
  externalClose: boolean;
  isModel?: boolean;
}) {
  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarFocus, setSearchBarFocus] = useState(false);

  const { linkTrainingPlanToModel, planState } = useNewPlan();

  const data = [
    {
      id: 1,
      name: "Modelo Ciclistas",
      blocks: 4,
      trainingModel: "2x1",
      duration: "12 semanas",
    },
    {
      id: 2,
      name: "Modelo Triatletas",
      blocks: 6,
      trainingModel: "3x1",
      duration: "16 semanas",
    },
    {
      id: 3,
      name: "Modelo Runners",
      blocks: 5,
      trainingModel: "2x2",
      duration: "10 semanas",
    },
  ];

  // Filter models based on search term
  const filteredModels = data.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onClose = () => {
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      closePopup();
    }, 300);
  };

  useEffect(() => {
    if (externalClose) {
      onClose();
    }
  }, [externalClose]);

  return (
    <div
      className={`bg-white absolute shadow-sm rounded-2xl left-[40%] top-16 flex flex-col items-center w-1/2 ${animation} `}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <p className="mt-4 text-secondary text-2xl">Buscar Modelos de Planes</p>

      {/* Search bar */}
      <div className="w-3/4 mt-4">
        <div
          className={`${
            inputStyles.input
          } h-10 relative rounded-2xl bg-offWhite shadow-sm flex items-center px-4 ${
            searchBarFocus && inputStyles.focused
          }`}
        >
          <img src="/search.png" className="h-6 w-6 mr-2" alt="Search" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 h-full focus:outline-none bg-offWhite text-tertiary"
            onFocus={() => setSearchBarFocus(true)}
            onBlur={() => setSearchBarFocus(false)}
            placeholder="Buscar modelo..."
          />
          {searchTerm && (
            <img
              src="/close.png"
              className="h-6 w-6 hover:opacity-70 cursor-pointer active:opacity-40"
              onClick={() => setSearchTerm("")}
              alt="Clear"
            />
          )}
        </div>
      </div>
      <p className="my-2 text-darkGray">
        Haga click en un modelo para seleccionarlo
      </p>

      <div className="flex flex-col items-center w-full overflow-auto max-h-[70vh] mt-4">
        {filteredModels.length > 0 ? (
          filteredModels.map((model, index) => (
            <div
              key={model.id}
              className={`w-3/4 border border-gray rounded-2xl flex hover:cursor-pointer hover:bg-offWhite active:opacity-40 transition-all duration-200 ${
                index > 0 ? "mt-2" : ""
              }`}
              onClick={async () => {
                try {
                  await linkTrainingPlanToModel(
                    planState.id,
                    model.id.toString()
                  );
                  onClose();
                } catch (error) {
                  console.error("Error linking plan to model:", error);
                }
              }}
            >
              <div className="w-2/5 flex items-center justify-center">
                <img src="/planRed.png" alt="" className="h-16 w-16" />
              </div>
              <div className="w-3/5 flex flex-col items-center">
                <p className="text-secondary text-xl mt-8 mb-4">{model.name}</p>
                <p className="text-darkGray text-lg">
                  N de bloques:{" "}
                  <span className="text-tertiary">{model.blocks}</span>
                </p>
                <p className="mt-2 text-darkGray text-lg">
                  Modelo de Entrenamiento:{" "}
                  <span className="text-tertiary">{model.trainingModel}</span>
                </p>
                <p className="mt-2 text-darkGray text-lg">
                  Duracion:{" "}
                  <span className="text-tertiary">{model.duration}</span>
                </p>
                <OutlinedButton
                  containerStyles="my-4"
                  title="Ver Detalle"
                  icon="eye"
                  onClick={() => {}}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-tertiary text-lg mt-8">
            No se encontraron modelos
          </p>
        )}
      </div>
    </div>
  );
}

export default ModelChoicePopup;
