import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { genders, athleteAgeRanges } from "../types/Athletes";
import { formattedDisciplines } from "../constants/data";
import AutocompleteDropdown from "./AutocompleteDropdown";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
import useBackspaceNavigation from "../hooks/useBackspaceNavigation";

interface FilterState {
  age: string[];
  gender: string[];
  discipline: string[];
  institution: string[];
  category: string[];
}

interface AthleteFilterProps {
  onClose: () => void;
  selectedFilters: FilterState;
  setSelectedFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  institutions: string[];
  categories: string[];
  selectGroup?: boolean;
  onApply?: () => void;
}

function AthleteFilter({
  onClose,
  selectedFilters,
  setSelectedFilters,
  resetFilters,
  institutions,
  categories,
  selectGroup = false,
  onApply,
}: AthleteFilterProps) {
  const { t } = useTranslation();
  const [processedDisciplines, setProcessedDisciplines] =
    useState(formattedDisciplines);

  useBackspaceNavigation(onClose);

  const parseLabel = (id: string | number, criterion: keyof FilterState) => {
    const stringId = id.toString();
    switch (criterion) {
      case "discipline":
        return (
          formattedDisciplines.find((discipline) => discipline.id === stringId)
            ?.label || ""
        );
      case "gender":
        return genders.find((gender) => gender.id === stringId)?.label || "";
      case "age":
        return (
          athleteAgeRanges.find((range) => range.id.toString() === stringId)
            ?.label || ""
        );
      default:
        return "";
    }
  };

  const toggleFilter = (criterion: keyof FilterState, filterId: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [criterion]: prev[criterion].includes(filterId)
        ? prev[criterion].filter((id) => id !== filterId)
        : [...prev[criterion], filterId],
    }));
    if (criterion === "discipline") {
      setProcessedDisciplines(
        processedDisciplines.map((e) => e.id).includes(filterId)
          ? processedDisciplines.filter((e) => e.id !== filterId)
          : (() => {
              const discipline = formattedDisciplines.find(
                (e) => e.id === filterId
              );
              const index = formattedDisciplines.findIndex(
                (e) => e.id === filterId
              );
              return [
                ...processedDisciplines.slice(0, index),
                discipline,
                ...processedDisciplines.slice(index),
              ];
            })()
      );
    }
  };

  const renderFilterSection = (
    criterion: keyof FilterState,
    options: any[]
  ) => (
    <div className="mb-8">
      <p className="text-2xl mb-4">
        {t(criterion).charAt(0).toUpperCase() + t(criterion).slice(1)}
      </p>
      <div className="flex items-center gap-x-2">
        {criterion === "discipline" ? (
          <>
            <AutocompleteDropdown
              data={processedDisciplines}
              onSelect={(discipline) =>
                toggleFilter("discipline", discipline.id)
              }
              placeholder="Selecciona una disciplina"
              displayKey="label"
              field="discipline"
              maxHeight={160}
              autoResetOnSelect={true}
              className="mr-4"
            />
            {selectedFilters.discipline.map((filterId) => (
              <button
                key={`discipline-${filterId}`}
                onClick={() => toggleFilter("discipline", filterId)}
                className="rounded-2xl px-4 py-1 flex items-center justify-center font-light border border-secondary transition-colors duration-200   focus:outline-none bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              >
                {parseLabel(filterId, "discipline")}
                <img src="/close.png" className="w-5 h-5 ml-4" alt="Close" />
              </button>
            ))}
          </>
        ) : criterion === "institution" ? (
          options.map((option, index) => (
            <button
              key={index}
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                selectedFilters[criterion].includes(option)
                  ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  : ""
              }`}
              onClick={() => toggleFilter(criterion, option)}
            >
              {option}
            </button>
          ))
        ) : criterion === "category" ? (
          selectedFilters.discipline.length > 0 &&
          options.map((option, index) => (
            <button
              key={index}
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                selectedFilters[criterion].includes(option)
                  ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  : ""
              }`}
              onClick={() => toggleFilter(criterion, option)}
            >
              {option}
            </button>
          ))
        ) : (
          options.map(
            (option) =>
              option.id && (
                <button
                  key={option.id}
                  onClick={() => toggleFilter(criterion, option.id.toString())}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    selectedFilters[criterion].includes(option.id.toString())
                      ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                      : ""
                  }`}
                >
                  {t(option.label).charAt(0).toUpperCase() +
                    t(option.label).slice(1)}
                </button>
              )
          )
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white shadow-sm z-50 rounded-2xl p-8 mx-auto fixed top-[5%] left-1/2 -translate-x-1/2 flex flex-col`}
      style={{ minWidth: "90%" }}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="Close" />
      </div>
      <p className="mb-8 text-3xl text-secondary self-center">
        {selectGroup ? "Seleccionar Grupo" : "Filtrar Atletas"}
      </p>
      {renderFilterSection("gender", genders)}
      {renderFilterSection("age", athleteAgeRanges)}
      {renderFilterSection("institution", institutions)}
      {renderFilterSection("discipline", [])}{" "}
      {/* Empty array since we use AutocompleteDropdown */}
      {selectedFilters.discipline.length > 0 &&
        categories.length > 0 &&
        renderFilterSection("category", categories)}
      <div className="flex w-full items-center justify-center gap-x-24 mt-8">
        <OutlinedButton
          title="Restablecer Filtros"
          icon="reset"
          onClick={() => {
            resetFilters();
          }}
        />
        <TonalButton title="Aplicar Filtros" icon="check" onClick={onApply} />
      </div>
    </div>
  );
}

export default AthleteFilter;
