import React from "react";
import { useStudyContext } from "../contexts/StudyContext";
import { CompletedStudy, units } from "../types/Studies";
type CompletedStudyCardProps = {
  study: CompletedStudy;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void; // Corrected type
  height?: number;
  width?: number;
  onDelete: (study: string) => void;
};

function CompletedStudyCard({
  study,
  onClick,
  height,
  width,
  onDelete,
}: CompletedStudyCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 pt-4 `}
      style={{ width: width || "auto", height: height || "auto" }}
      onClick={onClick}
    >
      <h6 className="text-secondary mb-2 text-2xl">{study.studyInfo.name}</h6>
      {Object.keys(study.results).map((key) => (
        <div>
          <p className="text-lg text-darkGray mt-8">
            -{key}:{" "}
            <span className="text-black font-medium">
              {study.results[key]} {units[key]}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default CompletedStudyCard;
