import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import { useStudyContext } from "../contexts/StudyContext";
import BoscoStudiesList from "../components/BoscoStudiesList";
import inputStyles from "../styles/inputStyles.module.css";
import { Studies } from "../types/Studies";
import TestInProgress from "../components/TestInProgress";
function StartTest({
  isExpanded,
  onBlurChange,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  onBlurChange: (isBlurred: boolean) => void;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [noAthlete, setNoAthlete] = useState(false);

  const navigate = useNavigate();

  const { study, setStudy, athlete, resetAthlete } = useStudyContext();

  const searchAthlete = () => {
    customNavigate("forward", "startTest", "selectAthlete");
    setTimeout(() => {
      navigate("/selectAthlete");
    }, 300);
  };

  const newAthlete = () => {
    customNavigate("forward", "startTest", "newAthlete");
    setTimeout(() => {
      navigate("/newAthlete");
    }, 300);
  };

  const showInfo = () => {
    onBlurChange(true);
    setIsBlurred(true);
  };

  const hideInfo = () => {
    onBlurChange(false);
    setIsBlurred(false);
  };

  const startTest = () => {
    if (athlete.name.length === 0) {
      setNoAthlete(true);
      return;
    }
    onBlurChange(true);
    setTestInProgress(true);
  };

  const handleInputChange = (field: string, value: string) => {
    // Allow empty string (to clear input) or only digits
    if (field === "load" || field === "sensitivity") {
      if (value === "" || /^\d+$/.test(value)) {
        setStudy({ ...study, [field]: value });
      }
      return;
    }

    // For other fields, update normally
    setStudy({ ...study, [field]: value });
  };

  const onClose = () => {
    customNavigate("back", "startTest", "studies");
    setTimeout(() => {
      navigate("/");
    }, 200);
  };

  useEffect(() => {
    setNoAthlete(false);
  }, [athlete]);

  return (
    <div
      className={`flex-1  relative flex flex-col items-center transition-all duration-300 ease-in-out `}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 ${
          (isBlurred || testInProgress) && "blur-md pointer-events-none"
        } transition-all 300 ease-in-out ${animation}`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>

        <p className="text-5xl text-secondary self-center -mt-10">
          {study["name"]}
        </p>
        <p className="text-4xl mt-8 text-black">Datos del Atleta</p>
        {athlete.name.length ? (
          <div className="w-full self-center mt-12 flex items-center justify-center gap-x-16">
            <p className="text-2xl">
              Atleta Seleccionado:{" "}
              <span className="text-secondary">{athlete.name}</span>
            </p>
            <OutlinedButton
              title="Cambiar"
              onClick={resetAthlete}
              icon="reset"
            />
          </div>
        ) : (
          <div className="flex mt-12 justify-around items-center">
            <OutlinedButton
              large
              title="Buscar Atleta"
              onClick={searchAthlete}
              inverse
              icon="search"
              containerStyles="w-1/5"
            />
            <TonalButton
              large
              title="Añadir Atleta"
              onClick={newAthlete}
              inverse
              icon="add"
              containerStyles="w-1/5"
            />
          </div>
        )}

        {noAthlete && (
          <p className="text-secondary text-2xl self-center my-4">
            Seleccione un atleta
          </p>
        )}

        <p className="text-4xl mt-16 text-black">
          {study.type === "bosco" ? "Tests a Realizar" : "Datos del Test"}
        </p>
        <div className="px-8 mt-8">
          {study.type !== "bosco" && (
            <div className="flex items-center">
              <p className="text-black mr-8 w-36 text-right">Pie de Despegue</p>
              <button
                key={`${study.type}-left`}
                onClick={() => setStudy({ ...study, takeoffFoot: "left" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.takeoffFoot === "left" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Izquierdo
              </button>
              <button
                key={`${study.type}-right`}
                onClick={() => setStudy({ ...study, takeoffFoot: "right" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.takeoffFoot === "right" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Derecho
              </button>
              <button
                key={`${study.type}-both`}
                onClick={() => setStudy({ ...study, takeoffFoot: "both" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.takeoffFoot === "both" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Ambos
              </button>
            </div>
          )}
          {study.type !== "bosco" && study.type !== "multipleJumps" && (
            <div className="flex items-center mt-8">
              <p className="text-black w-36 text-end mr-12">Carga</p>
              <input
                type="numeric"
                className={`bg-offWhite border border-gray focus:outline-secondary rounded-2xl shadow-sm pl-2 w-20 h-10 text-black ${inputStyles.input}`}
                placeholder="70..."
                value={study.load}
                onChange={(e) => {
                  handleInputChange("load", e.target.value);
                }}
              />
              <button
                key={`${study.loadUnit}-right`}
                onClick={() => setStudy({ ...study, loadUnit: "kgs" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-8 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.loadUnit === "kgs" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Kgs
              </button>
              <button
                key={`${study.type}-both`}
                onClick={() => setStudy({ ...study, loadUnit: "lbs" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.loadUnit === "lbs" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Lbs
              </button>
            </div>
          )}
          {study.type === "multipleJumps" && (
            <div className="flex items-center mt-8">
              <p className="text-black mr-8 w-36 text-right">Criterio</p>
              <button
                key={`${study.criteria}-numberOfJumps`}
                onClick={() =>
                  setStudy({ ...study, criteria: "numberOfJumps" })
                }
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.criteria === "numberOfJumps" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                N° de saltos
              </button>
              <button
                key={`${study.criteria}-stiffness`}
                onClick={() => setStudy({ ...study, criteria: "stiffness" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.criteria === "stiffness" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Stiffness
              </button>
              <button
                key={`${study.type}-time`}
                onClick={() => setStudy({ ...study, criteria: "time" })}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  study.criteria === "time" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Tiempo
              </button>
            </div>
          )}
          {study.type !== "bosco" && (
            <div className="flex items-center mt-8 relative w-full">
              <p className="text-black w-36 text-end mr-12">Sensibilidad</p>
              <input
                type="numeric"
                className={`bg-offWhite border border-gray rounded-2xl shadow-sm pl-2 w-20 h-10 text-black ${inputStyles.input}`}
                placeholder="20..."
                value={study.sensitivity}
                onChange={(e) => {
                  handleInputChange("sensitivity", e.target.value);
                }}
              />
              <div
                className="flex items-center hover:opacity-70 cursor-pointer absolute right-0"
                onClick={showInfo}
              >
                <img src="/info.png" alt="" className="mr-2 h-6 w-6" />
                <p className="text-secondary ">Qué es la sensibilidad?</p>
              </div>
            </div>
          )}
          {study.type === "bosco" && (
            <BoscoStudiesList studies={study.studies} setStudy={setStudy} />
          )}
        </div>
        <TonalButton
          title="Realizar Test"
          icon="next"
          onClick={startTest}
          containerStyles="self-center my-8"
        />
      </div>
      {isBlurred && (
        <div className="bg-white shadow-lg rounded-2xl fixed w-1/2 left-1/4 top-1/4 flex flex-col items-center px-16 py-8">
          <div
            className="absolute top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={() => {
              setIsBlurred(false);

              onBlurChange(false);
            }}
          >
            <img src="/close.png" className="h-6 w-6" alt="" />
          </div>
          <p className="text-darkGray text-lg font-light mt-8">
            Los saltos con contramovimiento usan un descenso rápido previo para
            generar más potencia, lo que requiere un control especial de
            medición.
          </p>
          <TonalButton
            title="Continuar"
            icon="next"
            onClick={hideInfo}
            containerStyles="mt-12"
          />
        </div>
      )}
      {testInProgress && (
        <TestInProgress
          setTestInProgress={setTestInProgress}
          onBlurChange={onBlurChange}
        />
      )}
    </div>
  );
}

export default StartTest;
