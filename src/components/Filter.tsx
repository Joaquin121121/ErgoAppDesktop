import React, { useState } from "react";
import type { Study, Studies } from "../types/Studies";
import { statsToMeasure, availableEquipment } from "../types/Studies";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
import availableStudies from "../types/Studies";
import { Dispatch, SetStateAction } from "react";

interface FilterProps {
  selectedEquipment: string[]; // Changed from [string] to string[]
  setSelectedEquipment: (selectedEquipment: string[]) => void; // Fixed type
  selectedStatsToMeasure?: string[]; // Changed from [string] to string[]
  setSelectedStatsToMeasure?: (selectedStatsToMeasure: string[]) => void; // Fixed type
  setFilteredStudies: Dispatch<SetStateAction<[keyof Studies, Study][]>>;
  setIsBlurred: (isBlurred: boolean) => void;
  onBlurChange: (isBlurred: boolean) => void;
  top: number;
  right: number;
}

function Filter({
  selectedEquipment,
  setSelectedEquipment,
  selectedStatsToMeasure,
  setSelectedStatsToMeasure,
  setFilteredStudies,
  setIsBlurred,
  onBlurChange,
  top,
  right,
}: FilterProps) {
  const selectEquipment = (equipment: string): void => {
    if (!selectedEquipment.includes(equipment)) {
      setSelectedEquipment([...selectedEquipment, equipment]);
      return;
    }
    setSelectedEquipment(selectedEquipment.filter((e) => e !== equipment));
  };

  const selectStatsToMeasure = (statToMeasure: string): void => {
    if (!selectedStatsToMeasure.includes(statToMeasure)) {
      setSelectedStatsToMeasure([...selectedStatsToMeasure, statToMeasure]);
      return;
    }
    setSelectedStatsToMeasure(
      selectedStatsToMeasure.filter((e) => e !== statToMeasure)
    );
  };

  const resetFilters = () => {
    setSelectedEquipment([]);
    setSelectedStatsToMeasure([]);
  };

  const saveFilters = () => {
    setFilteredStudies(
      Object.entries(availableStudies).filter(([_, study]) => {
        // Removed explicit type here since we'll cast the whole result
        // If no filters are selected, show all studies
        if (
          selectedEquipment.length === 0 &&
          selectedStatsToMeasure.length === 0
        ) {
          return true;
        }

        // If only equipment filters are selected
        if (
          selectedEquipment.length > 0 &&
          selectedStatsToMeasure.length === 0
        ) {
          return study.preview.equipment.some((e: string) =>
            selectedEquipment.includes(e)
          );
        }

        // If only stats filters are selected
        if (
          selectedEquipment.length === 0 &&
          selectedStatsToMeasure.length > 0
        ) {
          return study.preview.statsToMeasure.some((e: string) =>
            selectedStatsToMeasure.includes(e)
          );
        }

        // If both filters are selected
        return (
          study.preview.equipment.some((e: string) =>
            selectedEquipment.includes(e)
          ) &&
          study.preview.statsToMeasure.some((e: string) =>
            selectedStatsToMeasure.includes(e)
          )
        );
      }) as [keyof Studies, Study][]
    );
    setIsBlurred(false);
    onBlurChange(false);
  };
  return (
    <div
      className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 w-[500px] px-8"
      style={{ top: `${top}px`, right: `${right}px` }}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={() => {
          setIsBlurred(false);
          onBlurChange(false);
        }}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <p className="text-xl text-tertiary ml-2 mt-8 mb-4">Equipamiento</p>
      <div className="flex mb-4">
        {availableEquipment.slice(0, 2).map((equipment) => (
          <button
            key={equipment}
            onClick={() => selectEquipment(equipment)}
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              selectedEquipment.includes(equipment) &&
              "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
            }`}
          >
            {equipment}
          </button>
        ))}
      </div>
      <div className="flex">
        {availableEquipment.slice(2).map((equipment) => (
          <button
            key={equipment}
            onClick={() => selectEquipment(equipment)}
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              selectedEquipment.includes(equipment) &&
              "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
            }`}
          >
            {equipment}
          </button>
        ))}
      </div>
      {/* <p className="text-xl text-tertiary ml-2 mt-8 mb-4">Objeto de Evaluación</p>
      <div className="flex mb-4">
        {statsToMeasure.slice(0, 2).map((statToMeasure) => (
          <button
            key={statToMeasure}
            onClick={() => selectStatsToMeasure(statToMeasure)}
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              selectedStatsToMeasure.includes(statToMeasure) &&
              "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
            }`}
          >
            {statToMeasure}
          </button>
        ))}
      </div>
      <div className="flex">
        {statsToMeasure.slice(2).map((statToMeasure) => (
          <button
            key={statToMeasure}
            onClick={() => selectStatsToMeasure(statToMeasure)}
            className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
              selectedStatsToMeasure.includes(statToMeasure) &&
              "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
            }`}
          >
            {statToMeasure}
          </button>
        ))}
      </div> */}
      <div className="mt-12 w-full flex mb-4 justify-between">
        <OutlinedButton
          title="Restablecer"
          onClick={resetFilters}
          containerStyles="w-[45%]"
          icon="reset"
        />
        <TonalButton
          title="Aplicar Filtros"
          onClick={saveFilters}
          containerStyles="w-[45%]"
          icon="check"
        />
      </div>
    </div>
  );
}

export default Filter;
