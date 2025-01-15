import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Study, NewStudy, statsToMeasure } from "../availableStudies";
import TonalButton from "../components/TonalButton";

function NewTest({
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
  const navigate = useNavigate();
  const [isBlurred, setIsBlurred] = useState(false);
  const [newStudy, setNewStudy] = useState<NewStudy>({
    name: "",
    description: "",
    preview: {
      equipment: [],
      time: 5,
      statsToMeasure: [],
    },
    jumpTypes: "simple",
  });

  const statsToMeasure = [
    "Potencia",
    "Explosividad",
    "Tren Inferior",
    "Tren Superior",
  ];

  const onClose = () => {
    customNavigate("back", "newTest", "studies");
    setTimeout(() => {
      navigate("/");
    }, 200);
  };

  const saveTest = () => {};

  {
    return (
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out `}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div
          className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 ${
            isBlurred && "blur-md"
          } transition-all 300 ease-in-out ${animation}`}
        >
          <div
            className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed flex justify-center cursor-pointer"
            onClick={onClose}
          >
            <img src="/close.png" className="h-10 w-10" alt="" />
          </div>
          <p className="text-5xl text-secondary self-center mb-4">Nuevo Test</p>
          <div className="flex items-center mt-8">
            <p className="text-black w-36 text-end mr-12">Nombre</p>
            <input
              type="text"
              className="bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black"
              placeholder="Ingrese el nombre del test..."
              onChange={(e) => {
                setNewStudy({ ...newStudy, name: e.target.value });
              }}
            />
          </div>
          <div className="flex items-center mt-8">
            <p className="text-black mr-8 w-36 text-right">Tipos de Salto</p>
            <button
              onClick={() => setNewStudy({ ...newStudy, jumpTypes: "simple" })}
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                newStudy.jumpTypes === "simple" &&
                "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              }`}
            >
              Simples
            </button>
            <button
              onClick={() =>
                setNewStudy({ ...newStudy, jumpTypes: "multiple" })
              }
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                newStudy.jumpTypes === "multiple" &&
                "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              }`}
            >
              Múltiples
            </button>
          </div>
          <div className="flex items-center mt-8">
            <p className="text-black mr-8 w-36 text-right">
              Instrumentos de Medición
            </p>
            <button
              onClick={() =>
                setNewStudy(
                  newStudy.preview.equipment.includes("Alfombra de Contacto")
                    ? {
                        ...newStudy,
                        preview: {
                          ...newStudy.preview,
                          equipment: newStudy.preview.equipment.filter(
                            (equipment) => equipment !== "Alfombra de Contacto"
                          ),
                        },
                      }
                    : {
                        ...newStudy,
                        preview: {
                          ...newStudy.preview,
                          equipment: [
                            ...newStudy.preview.equipment,
                            "Alfombra de Contacto",
                          ],
                        },
                      }
                )
              }
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                newStudy.preview.equipment.includes("Alfombra de Contacto") &&
                "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              }`}
            >
              Alfombra de Contacto
            </button>
            <button
              onClick={() =>
                setNewStudy(
                  newStudy.preview.equipment.includes("Encoder Lineal")
                    ? {
                        ...newStudy,
                        preview: {
                          ...newStudy.preview,
                          equipment: newStudy.preview.equipment.filter(
                            (equipment) => equipment !== "Encoder Lineal"
                          ),
                        },
                      }
                    : {
                        ...newStudy,
                        preview: {
                          ...newStudy.preview,
                          equipment: [
                            ...newStudy.preview.equipment,
                            "Encoder Lineal",
                          ],
                        },
                      }
                )
              }
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                newStudy.preview.equipment.includes("Encoder Lineal") &&
                "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              }`}
            >
              Encoder Lineal
            </button>
            <button
              onClick={() =>
                setNewStudy(
                  newStudy.preview.equipment.includes("Plataforma de Fuerza")
                    ? {
                        ...newStudy,
                        preview: {
                          ...newStudy.preview,
                          equipment: newStudy.preview.equipment.filter(
                            (equipment) => equipment !== "Plataforma de Fuerza"
                          ),
                        },
                      }
                    : {
                        ...newStudy,
                        preview: {
                          ...newStudy.preview,
                          equipment: [
                            ...newStudy.preview.equipment,
                            "Plataforma de Fuerza",
                          ],
                        },
                      }
                )
              }
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                newStudy.preview.equipment.includes("Plataforma de Fuerza") &&
                "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              }`}
            >
              Plataforma de Fuerza
            </button>
          </div>
          <div className="flex items-center mt-8">
            <p className="text-black mr-8 w-36 text-right">
              Objetos de Medición
            </p>
            {statsToMeasure.map((newStatToMeasure) => (
              <button
                onClick={() =>
                  setNewStudy(
                    newStudy.preview.statsToMeasure.includes(newStatToMeasure)
                      ? {
                          ...newStudy,
                          preview: {
                            ...newStudy.preview,
                            statsToMeasure:
                              newStudy.preview.statsToMeasure.filter(
                                (e) => e !== newStatToMeasure
                              ),
                          },
                        }
                      : {
                          ...newStudy,
                          preview: {
                            ...newStudy.preview,
                            statsToMeasure: [
                              ...newStudy.preview.statsToMeasure,
                              newStatToMeasure,
                            ],
                          },
                        }
                  )
                }
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  newStudy.preview.statsToMeasure.includes(newStatToMeasure) &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                {newStatToMeasure}
              </button>
            ))}
          </div>
          <div className="flex items-center mt-8">
            <p className="text-black mr-8 w-36 text-right">Descripción</p>
            <textarea
              name=""
              className="bg-offWhite shadow-sm text-black text-sm focus:outline-secondary ml-4 h-30 p-4 w-3/5 rounded-2xl"
              id=""
            ></textarea>
          </div>
          <TonalButton
            title="Guardar Test"
            icon="next"
            onClick={saveTest}
            containerStyles="self-center my-12"
          />
        </div>
      </div>
    );
  }
}

export default NewTest;
