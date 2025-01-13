import React from "react";
import type { Study, Studies } from "../availableStudies";

type StudyCardProps = {
  study: Studies[keyof Studies]; // This gets the type of any value in the Studies object
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void; // Corrected type
  height?: number;
  width?: number;
};

function StudyCard({ study, onClick, height, width }: StudyCardProps) {
  const elements = ["equipment", "time", "statsToMeasure"];

  return (
    <div
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl flex flex-col items-center hover:scale-105 hover:cursor-pointer transition-all duration-300 ease-in-out px-4 pt-4"
      style={{ width: width || "auto", height: height || "auto" }}
      onClick={onClick}
    >
      <h6 className="text-secondary mb-2 text-2xl">{study.name}</h6>
      <p className="text-xl mb-8 text-black">{study.description}</p>
      {elements.map((element) => (
        <div className="flex mb-8 w-3/4 items-center" key={element}>
          <img src={`/${element}.png`} alt={element} className="h-8 w-8" />
          <p className="ml-4 font-light text-darkGray">
            {element === "equipment"
              ? study.preview[element].join(", ")
              : element === "time"
              ? `${study.preview[element]} minutos`
              : study.preview[element].join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
}

export default StudyCard;
