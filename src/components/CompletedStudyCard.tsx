import React, { useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import { CompletedStudy, units } from "../types/Studies";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/utils";

type CompletedStudyCardProps = {
  study: CompletedStudy;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void; // Corrected type
  height?: number;
  width?: number;
  onDelete: (date: Date) => void;
};

function CompletedStudyCard({
  study,
  onClick,
  height,
  width,
  onDelete,
}: CompletedStudyCardProps) {
  const { t } = useTranslation();

  const cmjDisplayKeys = ["avgFlightTime", "avgHeightReached", "takeoffFoot"];
  const boscoDisplayKeys = ["cmj", "abalakov", "squatJump"];

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 py-4 `}
      style={{ width: width || "auto", height: height || "auto" }}
      onClick={onClick}
    >
      <div
        className="flex absolute right-2 top-2 hover:opacity-70 hover:cursor-pointer px-2 pb-4 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(study.date);
        }}
      >
        <img src="/delete.png" className="h-8 w-8" alt="" />
      </div>
      <p className="text-darkGray absolute top-2 left-2">
        {formatDate(study.date)}
      </p>
      <h6 className="text-secondary mt-4 mb-8 text-2xl">
        {study.studyInfo.name}
      </h6>

      {study.results.type === "bosco" ? (
        <div>
          {boscoDisplayKeys.map((key) => (
            <p className="text-lg text-darkGray mb-8">
              -{t(key)}:{" "}
              <span className="text-black font-medium">
                {study.results[key].avgHeightReached?.toFixed(1)}{" "}
                {units.heightReached}
              </span>
            </p>
          ))}
        </div>
      ) : (
        <div>
          {cmjDisplayKeys.map((key) => (
            <div>
              <p className="text-lg text-darkGray mb-8">
                -{t(key)}:{" "}
                <span className="text-black font-medium">
                  {typeof study.results[key] === "number"
                    ? study.results[key].toFixed(1) + " " + units[key]
                    : t(study.results[key])}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompletedStudyCard;
