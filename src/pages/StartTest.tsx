import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import { useStudyContext } from "../contexts/StudyContext";
import inputStyles from "../styles/inputStyles.module.css";
import TestInProgress from "../components/TestInProgress";
import { useTranslation } from "react-i18next";
import { VALIDATION_LIMITS } from "../constants/data";
import { MultipleDropJumpStudy } from "../types/Studies";
import { useBlur } from "../contexts/BlurContext";
import navAnimations from "../styles/animations.module.css";

const initialDropJumpHeights = [
  { cm: "20", ft: "0'8" },
  { cm: "30", ft: "1'0" },
  { cm: "40", ft: "1'4" },
  { cm: "50", ft: "1'8" },
  { cm: "60", ft: "2'0" },
  { cm: "70", ft: "2'4" },
  { cm: "80", ft: "2'8" },
];

function StartTest({
  isExpanded,
  animation,
  customNavigate,
  setSelectedOption,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  setSelectedOption: (selectedOption: string) => void;
}) {
  const {
    study,
    setStudy,
    athlete,
    resetAthlete,
    selectedAthletes,
    setSelectedAthletes,
  } = useStudyContext();

  const { isBlurred, setIsBlurred } = useBlur();
  const [popupAnimation, setPopupAnimation] = useState(
    navAnimations.popupFadeInTop
  );
  const [displayInfo, setDisplayInfo] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [noAthlete, setNoAthlete] = useState(false);
  const [prevHeight, setPrevHeight] = useState("");
  const [prevHeightUnit, setPrevHeightUnit] = useState(
    study.type === "multipleDropJump" ? study.heightUnit : ""
  );
  const [noDropJumpHeights, setNoDropJumpHeights] = useState(false);
  const [dropJumpHeights, setDropJumpHeights] = useState(
    initialDropJumpHeights
  );
  const [newHeightQuery, setNewHeightQuery] = useState("");

  const [selectedDropJumpHeights, setSelectedDropJumpHeights] = useState([]);

  const navigate = useNavigate();

  const { t } = useTranslation();

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
    setDisplayInfo(true);
    setIsBlurred(true);
  };

  const hideInfo = () => {
    setPopupAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setDisplayInfo(false);
      setIsBlurred(false);
      setPopupAnimation(navAnimations.popupFadeInTop);
    }, 200);
  };

  const startTest = () => {
    if (athlete.name.length === 0 && selectedAthletes.length === 0) {
      setNoAthlete(true);
      return;
    }

    if (study.type === "multipleDropJump") {
      if (selectedDropJumpHeights.length === 0) {
        setNoDropJumpHeights(true);
        return;
      }
      setStudy({ ...study, dropJumpHeights: selectedDropJumpHeights });
    }

    setIsBlurred(true);
    setTestInProgress(true);
  };

  const addDropJumpHeight = () => {
    if (study.type !== "multipleDropJump" || newHeightQuery === "") {
      return;
    }
    setSelectedDropJumpHeights([...selectedDropJumpHeights, newHeightQuery]);
    if (study.heightUnit === "cm") {
      // Convert cm to feet and inches
      const totalInches = parseFloat(newHeightQuery) / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);

      const newHeight = {
        cm: newHeightQuery,
        ft: `${feet}'${inches}`,
      };

      // Find index of height that differs most from new height
      let maxDiff = -1;
      let maxDiffIndex = 0;

      dropJumpHeights.forEach((h, index) => {
        const diff = Math.abs(parseFloat(h.cm) - parseFloat(newHeight.cm));
        if (diff > maxDiff) {
          maxDiff = diff;
          maxDiffIndex = index;
        }
      });

      // Create new array with heights sorted by cm value
      const newHeights = [...dropJumpHeights];
      newHeights.splice(maxDiffIndex, 1); // Remove most different height

      let insertIndex = 0;
      while (
        insertIndex < newHeights.length &&
        parseFloat(newHeights[insertIndex].cm) < parseFloat(newHeight.cm)
      ) {
        insertIndex++;
      }

      newHeights.splice(insertIndex, 0, newHeight);
      setDropJumpHeights(newHeights);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Handle empty string or numeric validation for load/sensitivity
    if (field === "load" || field === "sensitivity") {
      if (value === "" || /^\d+$/.test(value)) {
        setStudy({ ...study, [field]: value });
      }
      return;
    }

    // Height validation for feet/inches format
    if (field === "height") {
      if (!/^[0-9']*$/.test(value)) {
        return;
      }

      if (athlete.heightUnit === "ft" && value.length > 0) {
        // Don't allow inputs longer than 4 characters (e.g., "5'111")
        if (value.length > 4) return;

        // Validate format for 4 character inputs (e.g., "5'11")
        if (value.length === 4) {
          const chars = value.split("");
          const secondToLast = chars[2];
          const last = chars[3];
          if (secondToLast !== "1" || (last !== "0" && last !== "1")) {
            return;
          }
        }
      }

      // Additional height validation for drop jump studies
      if (study.type === "multipleDropJump" && value !== "") {
        if (study.heightUnit === "cm") {
          const numValue = parseFloat(value);
          if (numValue > VALIDATION_LIMITS.height.cm.max) {
            return;
          }
        } else if (study.heightUnit === "ft") {
          const [feet, inches = "0"] = value.split("'");
          const feetNum = parseInt(feet);

          // Validate feet only input
          if (value.length === 1 && feetNum > VALIDATION_LIMITS.height.ft.max) {
            return;
          }

          // Validate complete feet/inches input
          const inchesNum = parseInt(inches);
          if (!isNaN(feetNum) && !isNaN(inchesNum)) {
            const heightInCm = Math.round(feetNum * 30.48 + inchesNum * 2.54);
            if (heightInCm > VALIDATION_LIMITS.height.cm.max) {
              return;
            }
          }
        }
      }
    }

    // Store previous height unit for drop jump studies
    if (study.type === "multipleDropJump" && field === "heightUnit") {
      setPrevHeightUnit(study.heightUnit);
    }

    // Update study with new value
    setStudy({ ...study, [field]: value });
  };

  const onClose = () => {
    customNavigate("back", "startTest", "studies");
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger onClose if Backspace is pressed AND no input/textarea is focused
      if (
        event.key === "Backspace" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName
        )
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  useEffect(() => {
    const sortedHeights = [...selectedDropJumpHeights].sort((a, b) => {
      const heightA = parseFloat(a);
      const heightB = parseFloat(b);
      return heightA - heightB;
    });

    if (
      JSON.stringify(sortedHeights) !== JSON.stringify(selectedDropJumpHeights)
    ) {
      setSelectedDropJumpHeights(sortedHeights);
    }
  }, [selectedDropJumpHeights]);

  useEffect(() => {
    setNoAthlete(false);
  }, [athlete]);

  useEffect(() => {
    if (study.type !== "multipleDropJump") {
      return;
    }
    setNoDropJumpHeights(false);
  }, [selectedDropJumpHeights]);

  useEffect(() => {
    if (study.type !== "multipleDropJump") {
      return;
    }

    // Add ' to any single digit foot heights
    const updatedHeights = selectedDropJumpHeights.map((height) => {
      if (
        study.heightUnit === "ft" &&
        height.length === 1 &&
        !height.includes("'")
      ) {
        return `${height}'`;
      }
      return height;
    });

    if (
      JSON.stringify(updatedHeights) !== JSON.stringify(selectedDropJumpHeights)
    ) {
      setSelectedDropJumpHeights(updatedHeights);
    }
  }, [(study as MultipleDropJumpStudy).heightUnit]);

  // Handle height unit conversion
  useEffect(() => {
    if (study.type !== "multipleDropJump") {
      return;
    }

    if (study.heightUnit === "ft" && prevHeightUnit === "cm") {
      const convertedHeights = selectedDropJumpHeights.map((height) => {
        const heightNum = parseFloat(height);
        if (!isNaN(heightNum)) {
          // Convert total cm to inches first
          const totalInches = Math.round(heightNum / 2.54);
          // Then convert to feet and inches
          const feet = Math.floor(totalInches / 12);
          const inches = totalInches % 12;
          return `${feet}'${inches}`;
        }
        return height;
      });
      setSelectedDropJumpHeights(convertedHeights);
    }

    if (study.heightUnit === "cm" && prevHeightUnit === "ft") {
      const convertedHeights = selectedDropJumpHeights.map((height) => {
        const [feet, inches = "0"] = height.split("'");
        const feetNum = parseInt(feet);
        const inchesNum = parseInt(inches);
        if (!isNaN(feetNum) && !isNaN(inchesNum)) {
          return Math.round(feetNum * 30.48 + inchesNum * 2.54).toString();
        }
        return height;
      });
      setSelectedDropJumpHeights(convertedHeights);
    }

    setPrevHeightUnit(study.heightUnit);
  }, [(study as MultipleDropJumpStudy).heightUnit]);

  return (
    <div
      className={`flex-1  relative flex flex-col items-center transition-all duration-300 ease-in-out `}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col px-16 ${
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
          {t(study["name"])}
        </p>
        <p className="text-4xl mt-8 text-tertiary">Datos del Atleta</p>
        {athlete.name.length ? (
          <div className="w-full self-center mt-8 flex items-center justify-center gap-x-16">
            <p className="text-2xl">
              Atleta Seleccionado:{" "}
              <span className="text-secondary">{athlete.name}</span>
            </p>
            <OutlinedButton
              title="Cambiar"
              onClick={() => {
                resetAthlete();
                setSelectedAthletes([]);
              }}
              icon="reset"
            />
          </div>
        ) : selectedAthletes.length > 0 ? (
          <div className="w-full self-center mt-8 flex items-center justify-center gap-x-16">
            <p className="text-2xl" style={{ width: "800px" }}>
              Atletas Seleccionados:{" "}
              <span className="text-secondary">
                {selectedAthletes.map((athlete) => athlete.name).join(", ")}
              </span>
            </p>
            <OutlinedButton
              title="Cambiar"
              onClick={() => {
                resetAthlete();
                setSelectedAthletes([]);
              }}
              icon="reset"
            />
          </div>
        ) : (
          <div className="flex mt-8 justify-around items-center">
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

        <p
          className="text-4xl mt-16 text-tertiary"
          style={{ marginBottom: study.type !== "bosco" && "32px" }}
        >
          {study.type === "bosco" ? "Tests a Realizar" : "Datos del Test"}
        </p>
        <div className="px-8">
          {study.type === "bosco" && (
            <div className="flex flex-col px-8 relative">
              <ul className="mt-4 -mb-2">
                {study.studies.map((studyItem, index) => (
                  <li key={studyItem} className="w-48 rounded-2xl p-2 mb-1 ">
                    <p className="text-secondary text-lg">
                      {index + 1}. {t(studyItem)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {study.type !== "bosco" && study.type !== "multipleJumps" && (
            <div className="flex items-center">
              <p
                className="text-tertiary mr-8 w-40 text-lg text-end"
                style={{
                  width: study.type === "multipleDropJump" && "261px",
                }}
              >
                Pie de Despegue
              </p>
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
              {study.type === "multipleDropJump" ? (
                <div>
                  <div className="flex items-center">
                    <p
                      className=" mr-8 text-lg w-60"
                      style={{
                        width: study.type === "multipleDropJump" && "261px",
                      }}
                    >
                      Seleccionar Alturas de Caída
                    </p>

                    {dropJumpHeights.map((height) => (
                      <button
                        key={height.cm}
                        className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none truncate ${
                          selectedDropJumpHeights.includes(
                            height[study.heightUnit]
                          ) &&
                          "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                        }`}
                        onClick={() =>
                          setSelectedDropJumpHeights(
                            !selectedDropJumpHeights.includes(
                              height[study.heightUnit]
                            )
                              ? [
                                  ...selectedDropJumpHeights,
                                  height[study.heightUnit],
                                ]
                              : selectedDropJumpHeights.filter(
                                  (h) => h !== height[study.heightUnit]
                                )
                          )
                        }
                      >
                        {height[study.heightUnit]} {study.heightUnit}
                      </button>
                    ))}
                  </div>
                  {noDropJumpHeights && (
                    <p className="text-secondary text-lg self-center my-4">
                      Seleccione una altura de caída
                    </p>
                  )}
                  <div className="flex items-center mt-8">
                    <p
                      className={"text-lg text-end w-40 mr-12"}
                      style={{
                        width: study.type === "multipleDropJump" && "261px",
                      }}
                    >
                      Añadir Altura
                    </p>
                    <input
                      type="numeric"
                      className={`bg-offWhite border pl-2 border-gray focus:outline-secondary rounded-2xl shadow-sm  w-20 h-10 text-tertiary ${inputStyles.input}`}
                      placeholder="70..."
                      value={newHeightQuery}
                      onChange={(e) => {
                        setNewHeightQuery(e.target.value);
                      }}
                      maxLength={3}
                    />
                    <button
                      onClick={addDropJumpHeight}
                      className="w-8 ml-4 h-8 rounded-full bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary transition-opacity duration-200 ease-linear shadow-sm flex items-center justify-center hover:opacity-70 "
                    >
                      <img src="/add.png" className="h-6 w-6" alt="" />
                    </button>
                    <img
                      src="/reset.png"
                      className="h-7 w-7 ml-4 hover:opacity-70 cursor-pointer "
                      alt=""
                      onClick={() => {
                        setNewHeightQuery("");
                        setDropJumpHeights(initialDropJumpHeights);
                        setSelectedDropJumpHeights([]);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-tertiary w-40 text-end mr-12 text-lg">
                    Carga añadida
                  </p>

                  <input
                    type="numeric"
                    className={`bg-offWhite border border-gray focus:outline-secondary rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${inputStyles.input}`}
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
                </>
              )}
            </div>
          )}
          {study.type === "multipleJumps" && (
            <>
              <div className="flex items-center mt-8">
                <p className="text-tertiary mr-8 w-40 text-lg text-right">
                  Criterio
                </p>
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
              {study.criteria !== "stiffness" && (
                <div className="flex items-center mt-8 relative w-full">
                  <p className="text-tertiary w-40 text-end mr-12 text-lg">
                    {t(study.criteria)}
                  </p>
                  <input
                    type="numeric"
                    className={`bg-offWhite border border-gray rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${inputStyles.input}`}
                    placeholder="20..."
                    value={study.criteriaValue}
                    onChange={(e) => {
                      handleInputChange("criteriaValue", e.target.value);
                    }}
                  />
                  {study.criteria === "time" && (
                    <p className=" ml-2">segundos</p>
                  )}
                </div>
              )}
            </>
          )}
          <div
            className="flex items-center mt-8 relative w-full"
            style={{
              marginTop: study.type === "bosco" && "24px",
            }}
          >
            <p
              className="text-tertiary w-40 text-end mr-12 text-lg"
              style={{
                width: study.type === "multipleDropJump" && "261px",
              }}
            >
              Sensibilidad
            </p>
            <input
              type="numeric"
              className={`bg-offWhite border border-gray rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${inputStyles.input}`}
              placeholder="20..."
              value={study.sensitivity}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (Number(value) <= 500 && !isNaN(Number(value)))
                ) {
                  handleInputChange("sensitivity", value);
                }
              }}
            />
            <div
              className="flex items-center hover:opacity-70 cursor-pointer ml-8"
              onClick={showInfo}
            >
              <img src="/info.png" alt="" className="mr-2 h-6 w-6" />
              <p className="text-secondary ">Qué es la sensibilidad?</p>
            </div>
          </div>
        </div>
        <TonalButton
          title="Realizar Test"
          icon="next"
          onClick={startTest}
          containerStyles="self-center my-8"
        />
      </div>
      {displayInfo && (
        <div
          className={`bg-white shadow-lg rounded-2xl fixed w-1/2 left-1/2 -translate-x-1/2 top-8 flex flex-col items-center px-16 py-8 ${popupAnimation}`}
        >
          <div
            className="absolute top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={hideInfo}
          >
            <img src="/close.png" className="h-6 w-6" alt="" />
          </div>
          <p className="self-center mt-8 text-2xl text-secondary">
            Qué es la sensibilidad?
          </p>
          <p className=" mt-4">
            Valor expresado en milisegundos (ms) que establece el umbral mínimo
            de tiempo de vuelo que debe tener un salto para ser registrado.
            Todos los saltos con un tiempo de vuelo menor a este valor serán
            ignorados por el sistema, filtrando así impactos o rebotes no
            deseados. Su función principal es:
          </p>
          <ul className="list-disc list-inside  mt-2">
            <li>
              Adaptar la medición a diferentes tipos de usuarios (como niños o
              personas con descensos muy veloces)
            </li>
            <li>
              Garantizar lecturas precisas en saltos con contramovimiento (CMJ,
              Abalakov, Maximum Jump)
            </li>
            <li>
              Evitar falsos registros cuando el tiempo de vuelo es muy corto
            </li>
          </ul>

          <TonalButton
            title="Continuar"
            icon="next"
            onClick={hideInfo}
            containerStyles="mt-8"
          />
        </div>
      )}
      {testInProgress && (
        <TestInProgress
          setTestInProgress={setTestInProgress}
          customNavigate={customNavigate}
          tests={
            study.type === "bosco"
              ? study.studies
              : study.type === "multipleDropJump"
              ? study.dropJumpHeights.map(() => "dropJump")
              : [study.type]
          }
          setSelectedOption={setSelectedOption}
        />
      )}
    </div>
  );
}

export default StartTest;
