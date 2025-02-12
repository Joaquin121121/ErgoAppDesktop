import React from "react";
import { useTranslation } from "react-i18next";

function BoscoStudyCard({
  onClick,
  study,
  studyName,
  containerStyles,
}: {
  onClick: () => void;
  study: any;
  studyName: string;
  containerStyles: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 py-4 ${containerStyles}`}
      onClick={onClick}
    >
      <h6 className="text-secondary mt-4 mb-4 text-2xl">{t(studyName)}</h6>
      <div>
        <p className="text-xl text-black mt-8">
          Altura Promedio:{" "}
          <span className="text-secondary">{study.avgHeightReached} cm</span>
        </p>
        <p className="text-xl text-black mt-4">
          Vuelo Promedio:{" "}
          <span className="text-secondary">{study.avgFlightTime} s</span>
        </p>
      </div>
    </div>
  );
}

export default BoscoStudyCard;
