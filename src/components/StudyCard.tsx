import React, { useState } from "react";
import type { Study } from "../types/Studies";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";

type StudyCardProps = {
  study: Study;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void; // Corrected type
  height?: number;
  width?: number;
  onDelete: (study: string) => void;
};

function StudyCard({
  study,
  onClick,
  height,
  width,
  onDelete,
}: StudyCardProps) {
  const elements = ["equipment"];

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 pt-4 `}
      style={{ width: width || "auto", height: height || "auto" }}
      onClick={onClick}
    >
      {study.type === "custom" && (
        <div
          className="flex absolute right-2 top-2 hover:opacity-70 hover:cursor-pointer px-2 pb-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(study.name);
          }}
        >
          <img src="/delete.png" className="h-8 w-8" alt="" />
        </div>
      )}
      <h6 className="text-secondary mb-2 text-2xl">{study.name}</h6>
      <p className="text-xl mb-8 text-black">
        {study.description.length <= 26
          ? study.description
          : "Test Personalizado"}
      </p>
      {elements.map((element) => (
        <div className="flex mb-8 w-3/4 items-center" key={element}>
          <img src={`/${element}.png`} alt={element} className="h-8 w-8" />
          <p className="ml-4 font-light text-darkGray">
            {element === "equipment"
              ? study.preview[element].join(", ")
              : element === "time"
              ? `${study.preview[element]} minutos`
              : study.preview[element].length
              ? study.preview[element].join(", ")
              : "Rendimiento Físico"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default StudyCard;
