import React, { useState, useEffect } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import { useTranslation } from "react-i18next";
import OutlinedButton from "./OutlinedButton";
import {
  replaceRange,
  insertRange,
  deleteRange as deleteRangeUtil,
  rebalanceAroundAnchor,
} from "../utils/fatigueHandling";
import {
  EffortReduction,
  Exercise,
  Progression,
  VolumeReduction,
} from "../types/trainingPlan";
import TonalButton from "./TonalButton";
import { RangeEntry } from "../types/trainingPlan";
import { getReductionFromRangeEntries } from "../utils/utils";
import { useNewPlan } from "../contexts/NewPlanContext";
import { generateInitialProgression } from "../utils/utils";
function LoadManagement({
  animation,
  selectedExercises,
  onSave,
}: {
  animation: string;
  selectedExercises: Exercise[];
  onSave: (
    progression: Progression[] | null,
    fatigueHandling: VolumeReduction | EffortReduction | null,
    factorToReduce: "volume" | "effort" | undefined,
    blockModel: "sequential" | "series" | undefined
  ) => void;
}) {
  const { planState, currentSelectedExercise } = useNewPlan();
  const { t } = useTranslation();

  const defaultProgression = currentSelectedExercise
    ? generateInitialProgression(
        planState.nOfWeeks,
        currentSelectedExercise.seriesN,
        currentSelectedExercise.reps,
        currentSelectedExercise.effort
      )
    : [];

  const [progression, setProgression] = useState<Progression[]>(
    defaultProgression.slice(0, planState.nOfWeeks)
  );
  const [handleProgression, setHandleProgression] = useState(true);
  const [progressionModified, setProgressionModified] = useState(false);

  /* ------------------------------ Local state ----------------------------- */
  const initialFatigueHandling: RangeEntry[] = [
    { range: [1, 5], percentageDrop: 0 },
    { range: [6, 8], percentageDrop: 10 },
    { range: [9, 10], percentageDrop: 40 },
  ];

  const [handleFatigue, setHandleFatigue] = useState(false);
  const [factorToReduce, setFactorToReduce] = useState<"volume" | "effort">(
    "volume"
  );
  const [fatigueHandling, setFatigueHandling] = useState<RangeEntry[]>(
    initialFatigueHandling
  );

  const [currentFatigueValue, setCurrentFatigueValue] = useState({
    value: "",
    index: -1,
  });
  const [currentPercentageDrop, setCurrentPercentageDrop] = useState({
    value: "0",
    index: -1,
  });
  const [addingRange, setAddingRange] = useState(false);
  const [lastModifiedIndex, setLastModifiedIndex] = useState<number | null>(
    null
  );
  const [modified, setModified] = useState(false);
  const [blockModel, setBlockModel] = useState<"sequential" | "series">(
    "sequential"
  );

  /* --------------------- Progression editing state ----------------------- */
  const [currentSeriesValue, setCurrentSeriesValue] = useState({
    value: "",
    index: -1,
  });
  const [currentRepetitionsValue, setCurrentRepetitionsValue] = useState({
    value: "",
    index: -1,
  });
  const [currentEffortValue, setCurrentEffortValue] = useState({
    value: "",
    index: -1,
  });

  const exerciseName =
    selectedExercises.length === 1 && selectedExercises[0].name;

  /* ------------------------------ Handlers ----------------------------- */
  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const match = value.match(/^(?:$|(?:[1-9]|10)(?:-(?:|(?:[1-9]|10))?)?)$/);
    if (!match) return;
    setCurrentFatigueValue((prev) => ({ ...prev, value }));
  };

  const handleFatigueRangeModification = () => {
    const rawStart = parseInt(currentFatigueValue.value.split("-")[0]);
    const rawEnd = parseInt(currentFatigueValue.value.split("-")[1]);
    if (isNaN(rawStart)) return null;

    const newStart = rawStart;
    const newEnd = isNaN(rawEnd) ? rawStart : rawEnd;
    const [rangeStart, rangeEnd] =
      newStart <= newEnd ? [newStart, newEnd] : [newEnd, newStart];

    const actualIndex = fatigueHandling.length - 1 - currentFatigueValue.index;
    const oldRange = fatigueHandling[actualIndex]?.range;
    const oldPercentageDrop = fatigueHandling[actualIndex]?.percentageDrop ?? 0;

    // Check if the range has actually changed
    if (
      oldRange &&
      oldRange[0] === rangeStart &&
      (oldRange.length === 1 ? oldRange[0] : oldRange[1]) === rangeEnd
    ) {
      return { updatedList: null, newIndex: -1 };
    }

    // First replace the range and then determine if percentageDrop needs adjustment
    const updatedList = replaceRange(
      fatigueHandling,
      rangeStart,
      rangeEnd,
      oldPercentageDrop
    );

    // Find the index of the modified range in the updated list
    const newRangeIndex = updatedList.findIndex(
      (entry) =>
        entry.range[0] === rangeStart &&
        (entry.range.length === 1 ? entry.range[0] : entry.range[1]) ===
          rangeEnd
    );

    return { updatedList, newIndex: newRangeIndex };
  };

  const onPercentageDropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.split("%")[0] === "") {
      setCurrentPercentageDrop((prev) => ({ ...prev, value: "" }));
    }
    const value = parseInt(e.target.value.split("%")[0]);
    if (value >= 0 && value <= 100) {
      setCurrentPercentageDrop((prev) => ({
        ...prev,
        value: value.toString(),
      }));
    }
  };

  const handlePercentageDropModification = () => {
    const actualIndex =
      fatigueHandling.length - 1 - currentPercentageDrop.index;
    const value = parseInt(currentPercentageDrop.value);
    if (value >= 0 && value <= 100) {
      const updated = fatigueHandling.map((entry, i) =>
        i === actualIndex ? { ...entry, percentageDrop: value } : entry
      );
      return { updated, actualIndex };
    }
    return null;
  };

  const addRange = () => {
    setCurrentFatigueValue({ value: "", index: -1 });
    setCurrentPercentageDrop({ value: "", index: -1 });
    setAddingRange(true);
  };

  const handleSaveRange = () => {
    if (currentFatigueValue.value === "") {
      return null;
    }
    const parts = currentFatigueValue.value.split("-");
    const rawStart = parseInt(parts[0]);
    const rawEnd =
      parts.length > 1 && parts[1] !== "" ? parseInt(parts[1]) : rawStart;

    if (isNaN(rawStart) || isNaN(rawEnd)) {
      return null;
    }

    const [rangeStart, rangeEnd] =
      rawStart <= rawEnd ? [rawStart, rawEnd] : [rawEnd, rawStart];

    // First insert the range with a temporary percentageDrop of 0
    // We'll calculate the proper percentageDrop after the ranges are adjusted
    const tempUpdated = insertRange(fatigueHandling, rangeStart, rangeEnd, 0);

    // Find the index of the newly inserted range
    const newRangeIndex = tempUpdated.findIndex(
      (entry) =>
        entry.range[0] === rangeStart &&
        (entry.range.length === 1 ? entry.range[0] : entry.range[1]) ===
          rangeEnd
    );

    if (newRangeIndex !== -1) {
      // Find neighbors after insertion
      const leftNeighbor =
        newRangeIndex > 0 ? tempUpdated[newRangeIndex - 1] : null;
      const rightNeighbor =
        newRangeIndex < tempUpdated.length - 1
          ? tempUpdated[newRangeIndex + 1]
          : null;

      // Calculate percentageDrop based on the neighbors
      let percentageDrop: number;
      if (leftNeighbor && rightNeighbor) {
        percentageDrop = Math.round(
          (leftNeighbor.percentageDrop + rightNeighbor.percentageDrop) / 2
        );
      } else if (leftNeighbor) {
        percentageDrop = Math.min(100, leftNeighbor.percentageDrop + 5);
      } else if (rightNeighbor) {
        percentageDrop = Math.max(0, rightNeighbor.percentageDrop - 5);
      } else {
        percentageDrop = 0;
      }

      // Update the percentageDrop for the new range
      tempUpdated[newRangeIndex].percentageDrop = percentageDrop;
    }

    return tempUpdated;
  };

  const handleDelete = (targetIndex: number) => {
    const updated = deleteRangeUtil(fatigueHandling, targetIndex);
    setFatigueHandling(updated);
    setModified(true);
  };

  const resetFormState = () => {
    setFatigueHandling(initialFatigueHandling);
    setCurrentFatigueValue({ value: "", index: -1 });
    setCurrentPercentageDrop({ value: "", index: -1 });
    setModified(false);
  };

  const resetProgressionState = () => {
    setProgression(defaultProgression.slice(0, planState.nOfWeeks));
    setCurrentSeriesValue({ value: "", index: -1 });
    setCurrentRepetitionsValue({ value: "", index: -1 });
    setCurrentEffortValue({ value: "", index: -1 });
    setProgressionModified(false);
  };

  /* ------------------ Progression editing handlers ------------------- */
  const onSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    if (value === "" || (!isNaN(numValue) && numValue > 0 && numValue <= 10)) {
      setCurrentSeriesValue((prev) => ({ ...prev, value }));
    }
  };

  const handleSeriesModification = () => {
    if (currentSeriesValue.index === -1) return null;

    const value = parseInt(currentSeriesValue.value);
    if (!isNaN(value) && value > 0) {
      const updatedProgression = [...progression];
      updatedProgression[currentSeriesValue.index] = {
        ...updatedProgression[currentSeriesValue.index],
        series: value,
      };
      return updatedProgression;
    }

    return null;
  };

  const onRepetitionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Accept all changes to the input field, validation happens on blur
    setCurrentRepetitionsValue((prev) => ({ ...prev, value }));
  };

  const handleRepetitionsModification = () => {
    if (currentRepetitionsValue.index === -1) return null;

    // Validate the repetition format before saving
    const repValue = currentRepetitionsValue.value;
    const isValidFormat = /^(\d+)(-\d+)?$/.test(repValue);

    if (isValidFormat) {
      // Further validate the range if it's in format "x-y"
      if (repValue.includes("-")) {
        const [start, end] = repValue.split("-").map(Number);
        // Only save if start <= end and both are positive numbers
        if (start <= end && start > 0 && end > 0) {
          const updatedProgression = [...progression];
          updatedProgression[currentRepetitionsValue.index] = {
            ...updatedProgression[currentRepetitionsValue.index],
            repetitions: repValue,
          };
          return updatedProgression;
        }
      } else {
        // Single number format (just "x")
        const numValue = parseInt(repValue);
        if (numValue > 0) {
          const updatedProgression = [...progression];
          updatedProgression[currentRepetitionsValue.index] = {
            ...updatedProgression[currentRepetitionsValue.index],
            repetitions: repValue,
          };
          return updatedProgression;
        }
      }
    }

    return null;
  };

  const onEffortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    if (
      value === "" ||
      (!isNaN(numValue) && numValue >= 0 && numValue <= 100)
    ) {
      setCurrentEffortValue((prev) => ({ ...prev, value }));
    }
  };

  const handleEffortModification = () => {
    if (currentEffortValue.index === -1) return null;

    const value = parseInt(currentEffortValue.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      const updatedProgression = [...progression];
      updatedProgression[currentEffortValue.index] = {
        ...updatedProgression[currentEffortValue.index],
        effort: value,
      };
      return updatedProgression;
    }

    return null;
  };

  const localOnSave = () => {
    // First handle any in-progress edits to ensure we have the latest values
    let updatedProgression = [...progression];
    let updatedFatigueHandling = [...fatigueHandling];

    // Check for active progression field edits
    if (currentSeriesValue.index !== -1) {
      const result = handleSeriesModification();
      if (result) {
        updatedProgression = result;
      }
    }

    if (currentRepetitionsValue.index !== -1) {
      const result = handleRepetitionsModification();
      if (result) {
        updatedProgression = result;
      }
    }

    if (currentEffortValue.index !== -1) {
      const result = handleEffortModification();
      if (result) {
        updatedProgression = result;
      }
    }

    // Check for active fatigue handling field edits
    if (currentFatigueValue.index !== -1) {
      const result = handleFatigueRangeModification();
      if (result && result.updatedList) {
        updatedFatigueHandling = result.updatedList;
      }
    }

    if (currentPercentageDrop.index !== -1) {
      const result = handlePercentageDropModification();
      if (result) {
        updatedFatigueHandling = result.updated;
      }
    }

    // Handle a new range being added
    if (addingRange && currentFatigueValue.value) {
      const result = handleSaveRange();
      if (result) {
        updatedFatigueHandling = result;
      }
    }

    // Pass progression data only if handleProgression is enabled
    const progressionData = handleProgression ? updatedProgression : null;

    // Pass fatigue data only if handleFatigue is enabled
    const fatigueData = handleFatigue ? updatedFatigueHandling : null;

    // Pass factorToReduce only if handleFatigue is enabled
    const factorToReduceData = handleFatigue ? factorToReduce : undefined;

    // Call the onSave prop with the latest values
    onSave(
      progressionData,
      getReductionFromRangeEntries(factorToReduceData, fatigueData),
      factorToReduceData,
      blockModel
    );
  };

  /* --------------------------- Rebalance effect --------------------------- */
  useEffect(() => {
    if (lastModifiedIndex === null) return;

    // First sort fatigueHandling by range to ensure proper ordering
    const sorted = [...fatigueHandling].sort((a, b) => {
      const aStart = a.range[0];
      const bStart = b.range[0];
      return aStart - bStart;
    });

    // Apply rebalancing on the sorted array
    const corrected = rebalanceAroundAnchor(sorted, lastModifiedIndex);

    setLastModifiedIndex(null);

    // Only update if there were changes
    if (JSON.stringify(corrected) !== JSON.stringify(fatigueHandling)) {
      setFatigueHandling(corrected);
    }
  }, [fatigueHandling, lastModifiedIndex]);

  /* ----------------------------------------------------------------------- */
  return (
    <div className={`flex flex-col items-center w-[50vw] ${animation}`}>
      <p className="text-secondary text-2xl mt-8">
        Añadir {exerciseName ? "Ejercicio: " : "Bloque de Ejercicios"}
        {exerciseName && (
          <span className="text-tertiary">
            {exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1)}
          </span>
        )}
      </p>
      <div className="flex flex-col pl-20 w-full">
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

        <div className="flex gap-x-8 mt-8 mb-2 items-center">
          <p className="text-darkGray text-lg">Gestión de Progreso</p>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              handleProgression
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setHandleProgression(true)}
          >
            Sí
          </button>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              handleProgression === false
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setHandleProgression(false)}
          >
            No
          </button>
          {handleProgression && progressionModified && (
            <p
              className="text-secondary ml-4 cursor-pointer hover:opacity-70 active:opacity-40 transition-all duration-200"
              onClick={resetProgressionState}
            >
              Reiniciar gestión de progreso
            </p>
          )}
        </div>

        {handleProgression && (
          <>
            <div className="grid grid-cols-6  gap-x-8 gap-y-4 mt-4 mb-2">
              <div className="col-span-2" />
              <p className="text-darkGray text-center">Series</p>
              <p className="text-darkGray  text-center">Repeticiones</p>
              <p className="text-darkGray  text-center col-span-2">
                Carácter del Esfuerzo
              </p>
              {progression.map((p, index) => (
                <React.Fragment
                  key={`week-${index + 1}-${p.series}-${p.repetitions}`}
                >
                  <p className="text-darkGray text col-span-2 text-center">
                    Semana {index + 1}
                  </p>
                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto border border-transparent ${inputStyles.input}`}
                    value={
                      currentSeriesValue.index === index
                        ? currentSeriesValue.value
                        : p.series
                    }
                    onChange={onSeriesChange}
                    onFocus={() =>
                      setCurrentSeriesValue({
                        value: p.series.toString(),
                        index: index,
                      })
                    }
                    onBlur={() => {
                      const result = handleSeriesModification();
                      if (result) {
                        setProgression(result);
                        setProgressionModified(true);
                      }
                      setCurrentSeriesValue({ value: "", index: -1 });
                    }}
                  />
                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto border border-transparent ${inputStyles.input}`}
                    value={
                      currentRepetitionsValue.index === index
                        ? currentRepetitionsValue.value
                        : p.repetitions
                    }
                    onChange={onRepetitionsChange}
                    onFocus={() =>
                      setCurrentRepetitionsValue({
                        value: p.repetitions,
                        index: index,
                      })
                    }
                    onBlur={() => {
                      const result = handleRepetitionsModification();
                      if (result) {
                        setProgression(result);
                        setProgressionModified(true);
                      }
                      setCurrentRepetitionsValue({ value: "", index: -1 });
                    }}
                  />
                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto col-span-2 border border-transparent ${inputStyles.input}`}
                    value={
                      currentEffortValue.index === index
                        ? currentEffortValue.value
                        : p.effort
                    }
                    onChange={onEffortChange}
                    onFocus={() =>
                      setCurrentEffortValue({
                        value: p.effort.toString(),
                        index: index,
                      })
                    }
                    onBlur={() => {
                      const result = handleEffortModification();
                      if (result) {
                        setProgression(result);
                        setProgressionModified(true);
                      }
                      setCurrentEffortValue({ value: "", index: -1 });
                    }}
                  />
                </React.Fragment>
              ))}
            </div>
            <p className="mt-8 self-center pr-20">
              Haga click en un valor para editarlo
            </p>
          </>
        )}

        {/* Toggle Gestion de Fatiga */}
        <div className="flex gap-x-8 mt-8 mb-2 items-center">
          <p className="text-darkGray text-lg ">Gestión de Fatiga</p>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              handleFatigue
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setHandleFatigue(true)}
          >
            Sí
          </button>
          <button
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              handleFatigue === false
                ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                : ""
            }`}
            onClick={() => setHandleFatigue(false)}
          >
            No
          </button>
          {handleFatigue && modified && (
            <p
              className="text-secondary ml-4 cursor-pointer hover:opacity-70 active:opacity-40 transition-all duration-200"
              onClick={resetFormState}
            >
              Reiniciar gestion de fatiga
            </p>
          )}
        </div>

        {/* Detailed controls */}
        {handleFatigue && (
          <>
            <div className="flex gap-x-8 mt-8 mb-2">
              <p className="text-darkGray text-lg ">Reducir</p>
              <button
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  factorToReduce === "volume"
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => setFactorToReduce("volume")}
              >
                Volumen
              </button>
              <button
                className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  factorToReduce === "effort"
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => setFactorToReduce("effort")}
              >
                Carácter de esfuerzo
              </button>
            </div>

            {/* Grid list */}
            <div className="grid grid-cols-4 gap-x-8 gap-y-4 mt-8 mb-2">
              <p className="text-darkGray text-lg text-center ">
                Nivel de Fatiga
              </p>
              <p className="text-darkGray text-lg text-center col-span-2 ">
                Reduccion de {t(factorToReduce)}
              </p>
              <div className="w-6 h-6" />

              {[...fatigueHandling].reverse().map((e, index) => (
                <React.Fragment
                  key={`fatigue-${e.range[0]}-${e.range[1] || e.range[0]}`}
                >
                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto border border-transparent ${inputStyles.input}`}
                    value={
                      currentFatigueValue.index === index
                        ? currentFatigueValue.value
                        : e.range.length === 1
                        ? `${e.range[0]}`
                        : `${e.range[0]}-${e.range[1]}`
                    }
                    onChange={onValueChange}
                    onFocus={() =>
                      setCurrentFatigueValue({
                        value:
                          e.range.length === 1
                            ? `${e.range[0]}`
                            : `${e.range[0]}-${e.range[1]}`,
                        index: index,
                      })
                    }
                    onBlur={() => {
                      const result = handleFatigueRangeModification();
                      if (result && result.updatedList) {
                        setFatigueHandling(result.updatedList);
                        if (result.newIndex !== -1) {
                          setLastModifiedIndex(result.newIndex);
                        }
                        setModified(true);
                      }
                      setCurrentFatigueValue({ value: "", index: -1 });
                    }}
                  />

                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto col-span-2 border border-transparent ${inputStyles.input}`}
                    value={
                      currentPercentageDrop.index === index
                        ? currentPercentageDrop.value
                        : `${e.percentageDrop}%`
                    }
                    onChange={onPercentageDropChange}
                    onFocus={() =>
                      setCurrentPercentageDrop({
                        value: `${e.percentageDrop}`,
                        index: index,
                      })
                    }
                    onBlur={() => {
                      const result = handlePercentageDropModification();
                      if (result) {
                        setFatigueHandling(result.updated);
                        setLastModifiedIndex(result.actualIndex);
                        setModified(true);
                      }
                      setCurrentPercentageDrop({ value: "", index: -1 });
                    }}
                  />

                  <img
                    src="close.png"
                    alt=""
                    className={`h-6 w-6 hover:opacity-70 active:opacity-40 transition-all duration-200 cursor-pointer ${
                      fatigueHandling.length === 1
                        ? "opacity-0 pointer-events-none"
                        : ""
                    }`}
                    onClick={() =>
                      handleDelete(fatigueHandling.length - 1 - index)
                    }
                  />
                </React.Fragment>
              ))}

              {/* Adding new range */}
              {addingRange && (
                <>
                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto ${inputStyles.input}`}
                    value={currentFatigueValue.value}
                    onChange={onValueChange}
                    autoFocus
                    onBlur={() => {
                      const result = handleSaveRange();
                      if (result) {
                        setFatigueHandling(result);
                        setModified(true);
                      }
                      setCurrentFatigueValue({ value: "", index: -1 });
                      setCurrentPercentageDrop({ value: "", index: -1 });
                      setAddingRange(false);
                    }}
                  />

                  <input
                    className={`text-lg text-center rounded-2xl focus:outline-none w-20 self-center mx-auto ${inputStyles.input}`}
                    value={currentPercentageDrop.value}
                    onChange={onPercentageDropChange}
                    onBlur={() => {
                      const result = handlePercentageDropModification();
                      if (result) {
                        setFatigueHandling(result.updated);
                        setLastModifiedIndex(result.actualIndex);
                        setModified(true);
                      }
                      setCurrentPercentageDrop({ value: "", index: -1 });
                    }}
                  />
                  <div className="w-6 h-6"></div>
                </>
              )}
            </div>

            <p className="mt-8 self-center pr-20">
              Haga click en un valor para editarlo
            </p>

            <OutlinedButton
              title="Añadir Rango"
              onClick={addRange}
              icon="addRed"
              containerStyles="self-center mt-4 mr-20"
            />
          </>
        )}
      </div>
      <TonalButton
        onClick={localOnSave}
        title="Guardar Ejercicio"
        containerStyles="self-center mt-12 mb-8"
        icon="next"
      />
    </div>
  );
}

export default LoadManagement;
