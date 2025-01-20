import React, { useEffect, useState } from "react";
import { Athlete } from "../types/Athletes";

type AthleteCardProps = {
  athlete: Athlete;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  height?: number;
  width?: number;
  onDelete: (study: string) => void;
};

function AthleteCard({
  athlete,
  onClick,
  height,
  width,
  onDelete,
}: AthleteCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 pt-4 `}
      style={{ width: width || "auto", height: height || "auto" }}
      onClick={onClick}
    >
      <p className="text-secondary text-2xl self-center">{athlete.name}</p>
      <p className="text-xl text-darkGray mt-8 ml-4">
        -Disciplina:{" "}
        <span className="text-black font-medium">{athlete.discipline}</span>
      </p>
      <p className="text-xl text-darkGray mt-4 ml-4">
        -Categoría:{" "}
        <span className="text-black font-medium">{athlete.category}</span>
      </p>
      <p className="text-xl text-darkGray mt-4 ml-4">
        -Institución:{" "}
        <span className="text-black font-medium">{athlete.institution}</span>
      </p>
    </div>
  );
}

export default AthleteCard;
