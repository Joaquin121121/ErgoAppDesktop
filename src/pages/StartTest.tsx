import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import inputStyles from "../styles/inputStyles.module.css";
import StandardTest from "../components/tests/test-types/StandardTest";
import { useTranslation } from "react-i18next";
import { VALIDATION_LIMITS } from "../constants/data";
import { boscoTests } from "../types/Studies";
import { useTestContext } from "../contexts/TestContext";

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
  onBlurChange,
  animation,
  customNavigate,
  setSelectedOption,
}) {
  // Use the test context to access state and dispatch
  const { state, dispatch } = useTestContext();

  // Local UI state
  const [isBlurred, setIsBlurred] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [noAthlete, setNoAthlete] = useState(false);
  const [prevHeightUnit, setPrevHeightUnit] = useState(
    state.testType === "multipleDropJump" ? state.heightUnit : ""
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
    onBlurChange(true);
    setIsBlurred(true);
  };

  const hideInfo = () => {
    onBlurChange(false);
    setIsBlurred(false);
  };

  const startTest = () => {
    if (
      state.athlete.name.length === 0 &&
      state.selectedAthletes.length === 0
    ) {
      setNoAthlete(true);
      return;
    }

    if (state.testType === "multipleDropJump") {
      if (selectedDropJumpHeights.length === 0) {
        setNoDropJumpHeights(true);
        return;
      }

      // Set up drop jump heights in the state
      // We would need to create drop jump objects from the selected heights
      const dropJumps = selectedDropJumpHeights.map((height) => ({
        height: height,
        times: [],
        avgFlightTime: 0,
        avgHeightReached: 0,
        type: "dropJump" as const,
        takeoffFoot: state.takeoffFoot,
        sensitivity: state.sensitivity,
      }));

      dispatch({
        type: "SET_DROP_JUMPS",
        payload: dropJumps,
      });
    }

    onBlurChange(true);
    setTestInProgress(true);

    // Set the test status to ready
    dispatch({ type: "SET_STATUS", payload: "ready" });
  };

  const addDropJumpHeight = () => {
    if (state.testType !== "multipleDropJump" || newHeightQuery === "") {
      return;
    }

    setSelectedDropJumpHeights([...selectedDropJumpHeights, newHeightQuery]);

    if (state.heightUnit === "cm") {
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

  // These custom actions would need to be added to the testReducer
  const handleInputChange = (field, value) => {
    switch (field) {
      case "takeoffFoot":
        dispatch({
          type: "SET_TAKEOFF_FOOT",
          payload: value,
        });
        break;
      case "load":
        if (value === "" || /^\d+$/.test(value)) {
          dispatch({
            type: "SET_LOAD",
            payload: value,
          });
        }
        break;
      case "loadUnit":
        dispatch({
          type: "SET_LOAD_UNIT",
          payload: value,
        });
        break;
      case "heightUnit":
        dispatch({
          type: "SET_HEIGHT_UNIT",
          payload: value,
        });
        if (state.testType === "multipleDropJump") {
          setPrevHeightUnit(state.heightUnit);
        }
        break;
      case "criteria":
        dispatch({
          type: "SET_CRITERION",
          payload: value,
        });
        break;
      case "criteriaValue":
        dispatch({
          type: "SET_CRITERION_VALUE",
          payload: parseInt(value) || 0,
        });
        break;
      case "sensitivity":
        if (value === "" || (Number(value) <= 500 && !isNaN(Number(value)))) {
          dispatch({
            type: "SET_SENSITIVITY",
            payload: parseInt(value) || 0,
          });
        }
        break;
      default:
        console.warn(`Unhandled field: ${field}`);
    }
  };

  const onClose = () => {
    customNavigate("back", "startTest", "studies");
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  const resetAthlete = () => {
    dispatch({ type: "RESET_ATHLETE" });
    dispatch({ type: "SET_SELECTED_ATHLETES", payload: [] });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setNoAthlete(false);
  }, [state.athlete]);

  useEffect(() => {
    if (state.testType !== "multipleDropJump") {
      return;
    }
    setNoDropJumpHeights(false);
  }, [selectedDropJumpHeights]);

  useEffect(() => {
    if (state.testType !== "multipleDropJump") {
      return;
    }

    // Add ' to any single digit foot heights
    const updatedHeights = selectedDropJumpHeights.map((height) => {
      if (
        state.heightUnit === "ft" &&
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
  }, [state.heightUnit]);

  // Handle height unit conversion
  useEffect(() => {
    if (state.testType !== "multipleDropJump") {
      return;
    }

    if (state.heightUnit === "ft" && prevHeightUnit === "cm") {
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

    if (state.heightUnit === "cm" && prevHeightUnit === "ft") {
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

    setPrevHeightUnit(state.heightUnit);
  }, [state.heightUnit]);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out`}
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
          {t(state.testType)}
        </p>
        <p className="text-4xl mt-8 text-tertiary">Datos del Atleta</p>
        {state.athlete.name.length ? (
          <div className="w-full self-center mt-8 flex items-center justify-center gap-x-16">
            <p className="text-2xl">
              Atleta Seleccionado:{" "}
              <span className="text-secondary">{state.athlete.name}</span>
            </p>
            <OutlinedButton
              title="Cambiar"
              onClick={resetAthlete}
              icon="reset"
            />
          </div>
        ) : state.selectedAthletes.length > 0 ? (
          <div className="w-full self-center mt-8 flex items-center justify-center gap-x-16">
            <p className="text-2xl" style={{ width: "800px" }}>
              Atletas Seleccionados:{" "}
              <span className="text-secondary">
                {state.selectedAthletes
                  .map((athlete) => athlete.name)
                  .join(", ")}
              </span>
            </p>
            <OutlinedButton
              title="Cambiar"
              onClick={resetAthlete}
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
          style={{ marginBottom: state.testType !== "bosco" && "32px" }}
        >
          {state.testType === "bosco" ? "Tests a Realizar" : "Datos del Test"}
        </p>
        <div className="px-8">
          {state.testType === "bosco" && (
            <div className="flex flex-col px-8 relative">
              <ul className="mt-4 -mb-2">
                {boscoTests.map((testName, index) => (
                  <li key={testName} className="w-48 rounded-2xl p-2 mb-1">
                    <p className="text-secondary text-lg">
                      {index + 1}. {t(testName)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state.testType !== "bosco" && state.testType !== "multipleJumps" && (
            <div className="flex items-center">
              <p
                className="text-tertiary mr-8 w-40 text-lg text-end"
                style={{
                  width: state.testType === "multipleDropJump" && "261px",
                }}
              >
                Pie de Despegue
              </p>
              <button
                key={`${state.testType}-left`}
                onClick={() => handleInputChange("takeoffFoot", "left")}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  state.takeoffFoot === "left" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Izquierdo
              </button>
              <button
                key={`${state.testType}-right`}
                onClick={() => handleInputChange("takeoffFoot", "right")}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  state.takeoffFoot === "right" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Derecho
              </button>
              <button
                key={`${state.testType}-both`}
                onClick={() => handleInputChange("takeoffFoot", "both")}
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  state.takeoffFoot === "both" &&
                  "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                }`}
              >
                Ambos
              </button>
            </div>
          )}
          {state.testType !== "bosco" && state.testType !== "multipleJumps" && (
            <div className="flex items-center mt-8">
              {state.testType === "multipleDropJump" ? (
                <div>
                  <div className="flex items-center">
                    <p
                      className="mr-8 text-lg w-60"
                      style={{
                        width: state.testType === "multipleDropJump" && "261px",
                      }}
                    >
                      Seleccionar Alturas de Caída
                    </p>

                    {dropJumpHeights.map((height) => (
                      <button
                        key={height.cm}
                        className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none truncate ${
                          selectedDropJumpHeights.includes(
                            height[state.heightUnit]
                          ) &&
                          "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                        }`}
                        onClick={() =>
                          setSelectedDropJumpHeights(
                            !selectedDropJumpHeights.includes(
                              height[state.heightUnit]
                            )
                              ? [
                                  ...selectedDropJumpHeights,
                                  height[state.heightUnit],
                                ]
                              : selectedDropJumpHeights.filter(
                                  (h) => h !== height[state.heightUnit]
                                )
                          )
                        }
                      >
                        {height[state.heightUnit]} {state.heightUnit}
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
                        width: state.testType === "multipleDropJump" && "261px",
                      }}
                    >
                      Añadir Altura
                    </p>
                    <input
                      type="numeric"
                      className={`bg-offWhite border pl-2 border-gray focus:outline-secondary rounded-2xl shadow-sm w-20 h-10 text-tertiary ${inputStyles.input}`}
                      placeholder="70..."
                      value={newHeightQuery}
                      onChange={(e) => {
                        setNewHeightQuery(e.target.value);
                      }}
                      maxLength={3}
                    />
                    <button
                      onClick={addDropJumpHeight}
                      className="w-8 ml-4 h-8 rounded-full bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary transition-opacity duration-200 ease-linear shadow-sm flex items-center justify-center hover:opacity-70"
                    >
                      <img src="/add.png" className="h-6 w-6" alt="" />
                    </button>
                    <img
                      src="/reset.png"
                      className="h-7 w-7 ml-4 hover:opacity-70 cursor-pointer"
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
                    value={state.load}
                    onChange={(e) => {
                      handleInputChange("load", e.target.value);
                    }}
                  />
                  <button
                    key={`${state.loadUnit}-right`}
                    onClick={() => handleInputChange("loadUnit", "kgs")}
                    className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-8 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                      state.loadUnit === "kgs" &&
                      "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    }`}
                  >
                    Kgs
                  </button>
                  <button
                    key={`${state.testType}-both`}
                    onClick={() => handleInputChange("loadUnit", "lbs")}
                    className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                      state.loadUnit === "lbs" &&
                      "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    }`}
                  >
                    Lbs
                  </button>
                </>
              )}
            </div>
          )}
          {state.testType === "multipleJumps" && (
            <>
              <div className="flex items-center mt-8">
                <p className="text-tertiary mr-8 w-40 text-lg text-right">
                  Criterio
                </p>
                <button
                  key="numberOfJumps"
                  onClick={() => handleInputChange("criteria", "numberOfJumps")}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    state.criterion === "numberOfJumps" &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  N° de saltos
                </button>

                <button
                  key="time"
                  onClick={() => handleInputChange("criteria", "time")}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    state.criterion === "time" &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  Tiempo
                </button>
              </div>
              <div className="flex items-center mt-8 relative w-full">
                <p className="text-tertiary w-40 text-end mr-12 text-lg">
                  {t(state.criterion)}
                </p>
                <input
                  type="numeric"
                  className={`bg-offWhite border border-gray rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${inputStyles.input}`}
                  placeholder="20..."
                  value={state.criterionValue}
                  onChange={(e) => {
                    handleInputChange("criteriaValue", e.target.value);
                  }}
                />
                {state.criterion === "time" && <p className="ml-2">segundos</p>}
              </div>
            </>
          )}
          <div
            className="flex items-center mt-8 relative w-full"
            style={{
              marginTop: state.testType === "bosco" && "24px",
            }}
          >
            <p
              className="text-tertiary w-40 text-end mr-12 text-lg"
              style={{
                width: state.testType === "multipleDropJump" && "261px",
              }}
            >
              Sensibilidad
            </p>
            <input
              type="numeric"
              className={`bg-offWhite border border-gray rounded-2xl shadow-sm pl-2 w-20 h-10 text-tertiary ${inputStyles.input}`}
              placeholder="20..."
              value={state.sensitivity}
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
              <p className="text-secondary">Qué es la sensibilidad?</p>
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
      {isBlurred && (
        <div className="bg-white shadow-lg rounded-2xl fixed w-1/2 left-1/4 top-8 flex flex-col items-center px-16 py-8">
          <div
            className="absolute top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={() => {
              setIsBlurred(false);
              onBlurChange(false);
            }}
          >
            <img src="/close.png" className="h-6 w-6" alt="" />
          </div>
          <p className="self-center mt-8 text-xl">Qué es la sensibilidad?</p>
          <p className="mt-4">
            Valor expresado en milisegundos (ms) que establece el umbral mínimo
            de tiempo de vuelo que debe tener un salto para ser registrado.
            Todos los saltos con un tiempo de vuelo menor a este valor serán
            ignorados por el sistema, filtrando así impactos o rebotes no
            deseados. Su función principal es:
          </p>
          <ul className="list-disc list-inside mt-2">
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
        <StandardTest
          setTestInProgress={setTestInProgress}
          onBlurChange={onBlurChange}
          customNavigate={customNavigate}
        />
      )}
    </div>
  );
}
export default StartTest;
