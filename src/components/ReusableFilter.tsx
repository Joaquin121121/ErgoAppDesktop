import React from "react";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterSection {
  title: string;
  options: FilterOption[];
  selectedOptions: string[];
  onOptionSelect: (option: string) => void;
}

interface FilterProps {
  sections: FilterSection[];
  position: {
    top: number;
    right: number;
  };
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}

function ReusableFilter({
  sections,
  position: { top, right },
  onClose,
  onReset,
  onApply,
}: FilterProps) {
  const chunkArray = (arr: FilterOption[]): FilterOption[][] => {
    const chunks: FilterOption[][] = [];
    for (let i = 0; i < arr.length; i += 2) {
      chunks.push(arr.slice(i, i + 2));
    }
    return chunks;
  };

  return (
    <div
      className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 w-[500px] px-8"
      style={{ top: `${top}px`, right: `${right}px` }}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>

      {sections.map(({ title, options, selectedOptions, onOptionSelect }) => (
        <div key={title}>
          <p className="text-xl text-black ml-2 mt-8 mb-4">{title}</p>
          {chunkArray(options).map((chunk, rowIndex) => (
            <div key={rowIndex} className="flex mb-4">
              {chunk.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onOptionSelect(id)}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light ml-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    selectedOptions.includes(id) &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}

      <div className="mt-12 w-full flex mb-4 justify-between">
        <OutlinedButton
          title="Restablecer"
          onClick={onReset}
          containerStyles="w-[45%]"
          icon="reset"
        />
        <TonalButton
          title="Aplicar Filtros"
          onClick={onApply}
          containerStyles="w-[45%]"
          icon="check"
        />
      </div>
    </div>
  );
}

export default ReusableFilter;
