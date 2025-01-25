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
      <h6 className="text-secondary mb-2 text-2xl">{study.studyInfo.name}</h6>

      {study.studyInfo.name.toLowerCase() === "bosco" ? (
        <div>
          {Object.keys(study.results).map((key) => (
            <p className="text-lg text-darkGray mt-8">
              -{t(key)}:{" "}
              <span className="text-black font-medium">
                {study.results[key].heightReached.toFixed(1)}{" "}
                {units.heightReached}
              </span>
            </p>
          ))}
        </div>
      ) : (
        Object.keys(study.results).map((key) => (
          <div>
            <p className="text-lg text-darkGray mt-8">
              -{t(key)}:{" "}
              <span className="text-black font-medium">
                {study.results[key].toFixed(1)} {units[key]}
              </span>
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default CompletedStudyCard;
