import React, { useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import { CompletedStudy, units, boscoTests } from "../types/Studies";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/utils";

type CompletedStudyCardProps = {
  study: CompletedStudy;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void; // Corrected type
  height?: number;
  width?: number;
  onDelete: (id: string) => void;
  cardStyles?: string;
  disabled?: boolean;
  comparing?: boolean;
};

function CompletedStudyCard({
  study,
  onClick,
  height,
  width,
  onDelete,
  cardStyles,
  disabled,
  comparing,
}: CompletedStudyCardProps) {
  const { t } = useTranslation();

  const cmjDisplayKeys = ["load", "avgHeightReached", "takeoffFoot"];
  const dropJumpDisplayKeys = ["heights", "maxAvgHeightReached", "takeoffFoot"];
  const multipleJumpsDisplayKeys = [
    "avgStiffness",
    "avgHeightReached",
    "takeoffFoot",
  ];

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 py-4 
        ${disabled ? "opacity-50 pointer-events-none" : ""} ${
        cardStyles && cardStyles.length ? cardStyles : "border-transparent"
      } `}
      style={{ width: width || "auto", height: height || "auto" }}
      onClick={onClick}
    >
      {!comparing && (
        <div
          className="flex absolute right-2 top-2 hover:opacity-70 hover:cursor-pointer px-2 pb-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(study.id);
          }}
        >
          <img src="/delete.png" className="h-8 w-8" alt="" />
        </div>
      )}
      <p className="text-darkGray absolute top-2 left-2">
        {formatDate(study.date)}
      </p>
      <h6 className="text-secondary mt-4 mb-8 text-2xl">
        {study.studyInfo.name}
      </h6>

      {study.results.type === "bosco" ? (
        <div>
          {boscoTests.map((key) => (
            <p key={key} className="text-lg text-darkGray mb-8">
              -{t(key)}:{" "}
              <span className="text-tertiary font-medium">
                {study.results[key].avgHeightReached?.toFixed(2)}{" "}
                {units.heightReached}
              </span>
            </p>
          ))}
        </div>
      ) : (
        <div>
          {study.results.type === "multipleJumps"
            ? multipleJumpsDisplayKeys.map((key) => (
                <div key={key}>
                  <p className="text-lg text-darkGray mb-8">
                    -{t(key)}:{" "}
                    <span className="text-tertiary font-medium">
                      {typeof study.results[key] === "number"
                        ? study.results[key].toFixed(2) +
                          " " +
                          (study.results[`${key}Unit`]
                            ? study.results[`${key}Unit`]
                            : units[key])
                        : t(study.results[key])}
                    </span>
                  </p>
                </div>
              ))
            : study.results.type === "multipleDropJump"
            ? dropJumpDisplayKeys.map((key) => (
                <div key={key}>
                  <p className="text-lg text-darkGray mb-8">
                    -{t(key)}:{" "}
                    <span className="text-tertiary font-medium">
                      {key === "heights" &&
                      study.results.type === "multipleDropJump"
                        ? study.results.dropJumps
                            .map((jump) => jump.height)
                            .join(", ") +
                          " " +
                          study.results.heightUnit
                        : typeof study.results[key] === "number"
                        ? study.results[key].toFixed(2) +
                          " " +
                          (study.results[`${key}Unit`]
                            ? study.results[`${key}Unit`]
                            : units[key])
                        : t(study.results[key])}
                    </span>
                  </p>
                </div>
              ))
            : cmjDisplayKeys.map((key) => (
                <div key={key}>
                  <p className="text-lg text-darkGray mb-8">
                    -{t(key)}:{" "}
                    <span className="text-tertiary font-medium">
                      {typeof study.results[key] === "number"
                        ? (study.results[key] === 0
                            ? 0
                            : study.results[key].toFixed(2)) +
                          " " +
                          (study.results[`${key}Unit`]
                            ? study.results[`${key}Unit`]
                            : units[key])
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
