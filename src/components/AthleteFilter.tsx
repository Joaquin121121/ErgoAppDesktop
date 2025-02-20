import React from "react";
import { useTranslation } from "react-i18next";
import { genders, athleteAgeRanges } from "../types/Athletes";
import { formattedDisciplines } from "../constants/data";
import AutocompleteDropdown from "./AutocompleteDropdown";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";

interface FilterState {
  age: string[];
  gender: string[];
  discipline: string[];
}

interface AthleteFilterProps {
  onClose: () => void;
  selectedFilters: FilterState;
  setSelectedFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
}

function AthleteFilter({
  onClose,
  selectedFilters,
  setSelectedFilters,
  resetFilters,
}: AthleteFilterProps) {
  const { t } = useTranslation();

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
  };

  const renderFilterSection = (
    criterion: keyof FilterState,
    options: any[]
  ) => (
    <div className="mb-8">
      <p className="text-2xl mb-4">
        {t(criterion).charAt(0).toUpperCase() + t(criterion).slice(1)}
      </p>
      <div className="flex items-center gap-2">
        {criterion === "discipline" ? (
          <>
            <AutocompleteDropdown
              data={formattedDisciplines}
              onSelect={(discipline) =>
                toggleFilter("discipline", discipline.id)
              }
              placeholder="Selecciona una disciplina"
              displayKey="label"
              field="discipline"
            />
            {selectedFilters.discipline.map((filterId) => (
              <button
                key={`discipline-${filterId}`}
                onClick={() => toggleFilter("discipline", filterId)}
                className="rounded-2xl px-4 py-1 flex items-center justify-center font-light border border-secondary transition-colors duration-200   focus:outline-none bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              >
                {parseLabel(filterId, "discipline")}
              </button>
            ))}
          </>
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
      className="bg-white shadow-sm z-50 rounded-2xl p-8 mx-auto fixed top-[15%] right-[12%] flex flex-col"
      style={{ minWidth: "75%" }}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="Close" />
      </div>
      <p className="mt-8 mb-12 text-3xl text-secondary self-center">
        Filtrar Atletas
      </p>
      {renderFilterSection("gender", genders)}
      {renderFilterSection("age", athleteAgeRanges)}
      {renderFilterSection("discipline", [])}{" "}
      {/* Empty array since we use AutocompleteDropdown */}
      <div className="flex w-full items-center justify-center gap-x-24 mt-8">
        <OutlinedButton
          title="Restablecer Filtros"
          icon="reset"
          onClick={() => {
            resetFilters();
            onClose();
          }}
        />
        <TonalButton title="Aplicar Filtros" icon="check" onClick={onClose} />
      </div>
    </div>
  );
}

export default AthleteFilter;
