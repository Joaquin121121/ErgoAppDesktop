import React, { useState } from "react";
import type { Study } from "../availableStudies";
import { statsToMeasure, availableEquipment } from "../availableStudies";

function Filter({
  setFilteredStudies,
  setIsBlurred,
  onBlurChange,
  top,
  right,
}: {
  setFilteredStudies: (filteredStudies: [string, Study][]) => void;
  setIsBlurred: (isBlurred: boolean) => void;
  onBlurChange: (isBlurred: boolean) => void;
  top: number;
  right: number;
}) {
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  const selectEquipment = (equipment: string): void => {
    if (!selectedEquipment.includes(equipment)) {
      setSelectedEquipment([...selectedEquipment, equipment]);
      return;
    }
    setSelectedEquipment(selectedEquipment.filter((e) => e !== equipment));
  };

  return (
    <div
      className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8"
      style={{ top: `${top}px`, right: `${right}px` }}
    >
      <div
        className="absolute top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={() => {
          setIsBlurred(false);
          onBlurChange(false);
        }}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <p className="text-xl text-black ml-2 my-6">Equipamiento</p>
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
      Filter
    </div>
  );
}

export default Filter;
