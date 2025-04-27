import React, { useEffect, useState } from "react";
import { Athlete } from "../types/Athletes";
import { useTranslation } from "react-i18next";

type AthleteCardProps = {
  athlete: Athlete;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  height?: number;
  width?: number;
  onDelete: (study: string) => void;
  selected: boolean;
  comparing: boolean;
};

function AthleteCard({
  athlete,
  onClick,
  height,
  width,
  onDelete,
  selected,
  comparing,
}: AthleteCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 pt-4 border border-transparent `}
      style={{
        width: width || "auto",
        height: height || "auto",
        borderColor: selected ? "#E81D23" : "transparent",
      }}
      onClick={onClick}
    >
      {!comparing && (
        <div
          className="flex absolute right-2 top-2 hover:opacity-70 hover:cursor-pointer px-2 pb-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(athlete.name);
          }}
        >
          <img src="/delete.png" className="h-8 w-8" alt="" />
        </div>
      )}
      <p className="text-secondary text-2xl self-center w-[90%]">
        {athlete.name}
      </p>

      <div className="w-full flex justify-around items-center mb-8">
        <div>
          <p className="text-lg text-darkGray mt-8">
            -Disciplina:{" "}
            <span className="text-tertiary font-medium">
              {t(athlete.discipline)}
            </span>
          </p>
          <p className="text-lg text-darkGray mt-4 ">
            -Categoría:{" "}
            <span className="text-tertiary font-medium">
              {athlete.category}
            </span>
          </p>
          <p className="text-lg text-darkGray mt-4">
            -Institución:{" "}
            <span className="text-tertiary font-medium">
              {athlete.institution}
            </span>
          </p>
        </div>
        <img
          src={athlete.gender === "F" ? "/emily.png" : "/roger.png"}
          alt=""
          className="h-20 w-20 rounded-full overflow-hidden"
        />
      </div>
    </div>
  );
}

export default AthleteCard;
