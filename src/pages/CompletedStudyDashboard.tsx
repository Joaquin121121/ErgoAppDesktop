import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import navAnimations from "../styles/animations.module.css";
import { useStudyContext } from "../contexts/StudyContext";
import { CompletedStudy, boscoTests } from "../types/Studies";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import useBackspaceNavigation from "../hooks/useBackspaceNavigation";
import CustomAccordion from "../components/CustomAccordion";
import { getTrainingSolutions } from "../hooks/getTrainingSolutions";

interface CompletedStudyDashboardProps {
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  animation: string;
  isExpanded: boolean;
}

// Training solution interface
interface TrainingSolution {
  title: string;
  info: string;
  exerciseType: string;
  exerciseExamples: string[];
  comparedTo: string;
}

function CompletedStudyDashboard({
  customNavigate,
  animation,
  isExpanded,
}: CompletedStudyDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const date = params.get("date");
  const { athlete, setAthlete } = useStudyContext();
  const study: CompletedStudy = athlete.completedStudies.find(
    (e) => (typeof e.date === "string" ? e.date : e.date.toISOString()) === date
  );

  // Training solutions data
  const trainingSolutions: TrainingSolution[] =
    getTrainingSolutions(date, study.results.type) || [];

  // Format the accordion items
  const accordionItems = trainingSolutions.map((solution) => ({
    title: solution.title,
    content: (
      <ul className="list-disc pl-4">
        <li className="text-tertiary mb-2">{solution.info}</li>
        <li className="text-tertiary mb-2">{solution.exerciseType}</li>
        <li className="text-tertiary">
          Ejemplos de ejercicios:
          <ul className="list-circle pl-8">
            {solution.exerciseExamples.map((example, i) => (
              <li key={i} className="text-tertiary">
                {example}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    ),
  }));

  const getFormattedDate = (isoString: string) => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFormattedTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const onClose = () => {
    customNavigate("back", "completedStudyDashboard", "athleteStudies");
    setTimeout(() => {
      navigate("/athleteStudies");
    }, 300);
  };

  const showTest = () => {
    customNavigate("forward", "completedStudyDashboard", "completedStudyInfo");
    setTimeout(() => {
      navigate("/completedStudyInfo?date=" + date);
    }, 300);
  };

  useBackspaceNavigation(onClose);

  const tableJSX = (
    <table className="w-full mt-8 border-collapse">
      <thead className="w-full">
        <tr className="flex justify-around items-center w-full border-b  border-gray">
          {study.results.type === "multipleDropJump" ? (
            <th className="text-2xl w-52 font-normal text-tertiary border-r border-gray">
              Altura de Caída
            </th>
          ) : study.results.type === "bosco" ? (
            <th className="text-2xl w-40 font-normal text-tertiary border-r border-gray">
              Test
            </th>
          ) : (
            <th className="text-2xl w-40 font-normal text-tertiary border-r border-gray">
              Salto
            </th>
          )}
          <th className="text-2xl w-52 font-normal text-tertiary">
            Altura{" "}
            {study.results.type === "multipleDropJump" ||
            study.results.type === "bosco"
              ? "Promedio"
              : "Alcanzada"}
          </th>
        </tr>
      </thead>
      <tbody
        className="w-full block"
        style={{
          maxHeight: "600px",
          overflowY: "auto",
        }}
      >
        {study.results.type === "bosco"
          ? boscoTests.map((test, i) => (
              <tr
                key={i}
                className="mt-2 text-tertiary text-xl flex  justify-around items-center w-full border-b border-gray"
              >
                <td className="text-inherit w-40 flex items-center justify-center border-r border-gray">
                  {t(test)}
                </td>
                <td className="text-inherit w-52 flex items-center justify-center">
                  {study.results[test].avgHeightReached
                    ? `${study.results[test].avgHeightReached.toFixed(2)} cm`
                    : "-"}
                </td>
              </tr>
            ))
          : study.results.type === "multipleDropJump"
          ? study.results.dropJumps.map((dropJump, i) => (
              <tr
                key={i}
                className="mt-2 text-tertiary text-xl flex  justify-around items-center w-full border-b border-gray"
              >
                <td className="text-inherit w-52 flex items-center justify-center border-r border-gray">
                  {dropJump.height}{" "}
                  {study.results.type === "multipleDropJump" &&
                    study.results.heightUnit}
                </td>
                <td className="text-inherit w-52 flex items-center justify-center">
                  {dropJump.avgHeightReached
                    ? `${dropJump.avgHeightReached.toFixed(2)} cm`
                    : "-"}
                </td>
              </tr>
            ))
          : study.results.times.map((time, i) => (
              <tr
                key={i}
                className="mt-2 text-tertiary text-xl flex  justify-around items-center w-full border-b border-gray"
              >
                <td className="text-inherit w-40 flex items-center justify-center border-r border-gray">
                  {i + 1}
                </td>
                <td className="text-inherit w-52 flex items-center justify-center">
                  {Number((((9.81 * time.time ** 2) / 8) * 100).toFixed(2))} cm
                </td>
              </tr>
            ))}
      </tbody>
      {study.results.type !== "multipleDropJump" &&
        study.results.type !== "bosco" && (
          <tfoot className="w-full block">
            <tr className="text-darkGray mt-2 text-xl flex  justify-around items-center w-full linear border-b border-gray">
              <td className="text-secondary w-40 flex items-center justify-center border-r border-gray">
                Promedio
              </td>
              <td className="text-secondary w-52 flex items-center justify-center">
                {study.results
                  ? `${study.results.avgHeightReached.toFixed(2)} cm`
                  : "-"}
              </td>
            </tr>
          </tfoot>
        )}
    </table>
  );

  return (
    <div
      className={`flex-1  relative flex flex-col items-center transition-all duration-300 ease-in-out ${animation}`}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div className="flex w-full justify-around items-center">
        <div className="w-[124px]"></div>
        <div className="flex flex-col items-center">
          <p className="text-4xl text-secondary mt-8">{study.studyInfo.name}</p>
          <p className="mt-2 mb-4 text-xl ">
            Realizado por {athlete.name} el {getFormattedDate(date)} a las{" "}
            {getFormattedTime(date)}
          </p>
        </div>
        <TonalButton
          title="Volver"
          icon="backWhite"
          onClick={onClose}
          inverse
        />
      </div>

      <div className="w-full flex justify-center gap-x-4">
        <div
          className={`w-[35%] h-[90%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col items-center transition-all 300 ease-in-out `}
        >
          <div className="flex gap-x-8 mt-4 items-center">
            <p className="text-secondary text-2xl">Resultados</p>
            <img src="/results.png" alt="" className="h-9 w-9" />
          </div>
          {tableJSX}
          {study.results.type !== "bosco" && (
            <>
              {study.results.type === "multipleJumps" ? (
                <>
                  <p className="mt-8 text-lg">
                    Stiffness Promedio:{" "}
                    <span className="text-secondary">
                      {study.results.avgStiffness.toFixed(2)} N/m
                    </span>
                  </p>
                  <p className="mt-2 text-lg">
                    Caída de Rendimiento:{" "}
                    <span className="text-secondary">
                      {study.results.performanceDrop.toFixed(2)}%
                    </span>
                  </p>
                </>
              ) : study.results.type === "multipleDropJump" ? (
                <>
                  <p className="mt-8 text-lg">
                    Pie de Despegue:{" "}
                    <span className="text-secondary">
                      {t(study.results.takeoffFoot)}
                    </span>
                  </p>
                  <p className="mt-2 text-lg">
                    Mayor Altura de Salto:{" "}
                    <span className="text-secondary">
                      {study.results.maxAvgHeightReached.toFixed(2)} cm
                    </span>
                  </p>

                  <p className="mt-2 text-lg">
                    Altura de Caída con Salto Máximo:{" "}
                    <span className="text-secondary">
                      {study.results.bestHeight} {study.results.heightUnit}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-8 text-lg">
                    Pie de Despegue:{" "}
                    <span className="text-secondary">
                      {t(study.results.takeoffFoot)}
                    </span>
                  </p>
                  <p className="mt-2 text-lg">
                    Carga Añadida:{" "}
                    <span className="text-secondary">
                      {study.results.load} {study.results.loadUnit}
                    </span>
                  </p>
                </>
              )}
            </>
          )}

          <TonalButton
            containerStyles="my-8 "
            title="Ver Test"
            icon="testWhite"
            onClick={showTest}
          />
        </div>
        <div
          className={`w-[62%] h-[90%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col px-16 transition-all 300 ease-in-out`}
        >
          <div className="flex self-center gap-x-8 mt-4 items-center">
            <p className="text-secondary text-2xl">
              Solución de Entrenamiento Inferida
            </p>
            <img src="/lightningRed.png" alt="" className="h-9 w-9" />
          </div>

          {/* Using the new CustomAccordion component */}
          <div className="w-full mt-4">
            <CustomAccordion
              items={accordionItems}
              initialExpandedIndex={0}
              showButton={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletedStudyDashboard;
