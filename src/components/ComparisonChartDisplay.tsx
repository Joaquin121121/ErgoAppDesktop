import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TonalButton from "./TonalButton";
import OutlinedButton from "./OutlinedButton";
import { JumpTime } from "../types/Studies";
import { useTranslation } from "react-i18next";

function ComparisonChartDisplay({
  setShowChart,
  jumpTimesA,
  jumpTimesB,
  chartAnimation,
  onClose,
  type1,
  type2,
}: {
  setShowChart: (show: boolean) => void;
  jumpTimesA: JumpTime[];
  jumpTimesB: JumpTime[];
  chartAnimation: string;
  onClose: () => void;
  type1: string;
  type2: string;
}) {
  const validJumpTimesA = jumpTimesA.filter((e) => !e.deleted);
  const validJumpTimesB = jumpTimesB.filter((e) => !e.deleted);

  const maxLength = Math.max(validJumpTimesA.length, validJumpTimesB.length);

  const timesData = Array.from({ length: maxLength }, (_, i) => ({
    index: i,
    timeA: validJumpTimesA[i]
      ? Number(validJumpTimesA[i].time.toFixed(2))
      : null,
    timeB: validJumpTimesB[i]
      ? Number(validJumpTimesB[i].time.toFixed(2))
      : null,
  }));

  const heightData = Array.from({ length: maxLength }, (_, i) => ({
    index: i,
    heightA: validJumpTimesA[i]
      ? Number((((9.81 * validJumpTimesA[i].time ** 2) / 8) * 100).toFixed(1))
      : null,
    heightB: validJumpTimesB[i]
      ? Number((((9.81 * validJumpTimesB[i].time ** 2) / 8) * 100).toFixed(1))
      : null,
  }));

  const [buttonText, setButtonText] = useState("Alturas");
  const [data, setData] = useState<any>(timesData);
  const { t } = useTranslation();

  const toggleGraph = () => {
    if (buttonText === "Alturas") {
      setData(heightData);
      setButtonText("Tiempos");
    } else {
      setData(timesData);
      setButtonText("Alturas");
    }
  };

  return (
    <div
      className={`bg-white shadow-sm border border-gray fixed z-50 rounded-2xl py-2 px-8 w-[1400px]
             top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pt-12 transition-all duration-300 ease-linear ${chartAnimation}`}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="Close" />
      </div>
      <div className=" flex items-center justify-center">
        <p className="text-3xl text-secondary mr-16 ">
          Comparación de{" "}
          {buttonText === "Alturas" ? "Tiempos de Vuelo" : "Alturas"}
        </p>
        <TonalButton
          title={"Ver " + buttonText}
          onClick={toggleGraph}
          icon="studies"
        />
      </div>
      <div className="w-full" style={{ height: "600px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 60, bottom: 60, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              label={{
                value: "N° de Salto",
                position: "bottom",
                offset: 0,
              }}
            />
            <YAxis
              label={{
                value: buttonText === "Alturas" ? "Tiempo (s)" : "Altura (cm)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              }}
            />
            <Legend
              wrapperStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                width: "100%",
                paddingTop: "30px",
                marginTop: "20px",
              }}
              verticalAlign="bottom"
              iconType="circle"
              layout="horizontal"
              align="center"
            />
            {buttonText === "Alturas" ? (
              <>
                <Bar
                  dataKey="timeA"
                  fill="#e81d23"
                  name={`${t(type1)} ${type1 === type2 ? "A" : ""}`}
                  barSize={20}
                />
                <Bar
                  dataKey="timeB"
                  fill="#FFC1C1"
                  name={`${t(type2)} ${type1 === type2 ? "B" : ""}`}
                  barSize={20}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="heightA"
                  fill="#e81d23"
                  name={`${t(type1)} ${type1 === type2 ? "A" : ""}`}
                  barSize={20}
                />
                <Bar
                  dataKey="heightB"
                  fill="#FFC1C1"
                  name={`${t(type2)} ${type1 === type2 ? "B" : ""}`}
                  barSize={20}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full mb-8 flex items-center justify-around">
        <OutlinedButton title="Volver" icon="back" onClick={onClose} inverse />
      </div>
    </div>
  );
}

export default ComparisonChartDisplay;
