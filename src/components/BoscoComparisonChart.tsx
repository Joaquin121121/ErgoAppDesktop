import React, { useState } from "react";
import {
  BarChart,
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
import { useTranslation } from "react-i18next";

interface BoscoComparisonChartProps {
  avgHeightReachedA: number;
  avgHeightReachedB: number;
  avgHeightReachedC?: number;
  avgFlightTimeA: number;
  avgFlightTimeB: number;
  avgFlightTimeC?: number;
  chartAnimation: string;
  onClose: () => void;
  type1: string;
  type2: string;
  type3?: string;
}

function BoscoComparisonChart({
  avgHeightReachedA,
  avgHeightReachedB,
  avgHeightReachedC,
  avgFlightTimeA,
  avgFlightTimeB,
  avgFlightTimeC,
  chartAnimation,
  onClose,
  type1,
  type2,
  type3,
}: BoscoComparisonChartProps) {
  const [showHeights, setShowHeights] = useState(true);
  const { t } = useTranslation();

  const heightData = [
    {
      name: t(type1),
      value: Number(avgHeightReachedA.toFixed(1)),
      fill: "#e81d23",
    },
    {
      name: t(type2),
      value: Number(avgHeightReachedB.toFixed(1)),
      fill: "#FFC1C1",
    },
    ...(avgHeightReachedC
      ? [
          {
            name: t(type3!),
            value: Number(avgHeightReachedC.toFixed(1)),
            fill: "#FF7F7F",
          },
        ]
      : []),
  ];

  const timeData = [
    {
      name: t(type1),
      value: Number(avgFlightTimeA.toFixed(2)),
      fill: "#e81d23",
    },
    {
      name: t(type2),
      value: Number(avgFlightTimeB.toFixed(2)),
      fill: "#FFC1C1",
    },
    ...(avgFlightTimeC
      ? [
          {
            name: t(type3!),
            value: Number(avgFlightTimeC.toFixed(2)),
            fill: "#FF7F7F",
          },
        ]
      : []),
  ];

  const toggleGraph = () => {
    setShowHeights(!showHeights);
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
      <div className="flex items-center justify-center">
        <p className="text-3xl text-secondary mr-16">
          Promedio de {showHeights ? "Alturas" : "Tiempos de Vuelo"}
        </p>
        <TonalButton
          title={`Ver ${showHeights ? "Tiempos" : "Alturas"}`}
          onClick={toggleGraph}
          icon="studies"
        />
      </div>
      <div className="w-full" style={{ height: "600px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={showHeights ? heightData : timeData}
            margin={{ top: 20, right: 60, bottom: 60, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={{
                value: "Tipo de Test",
                position: "bottom",
                offset: 0,
              }}
            />
            <YAxis
              label={{
                value: showHeights ? "Altura (cm)" : "Tiempo (s)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              }}
              formatter={(value: number, name: string) => [
                value,
                showHeights ? "Altura (cm)" : "Tiempo de Vuelo (s)",
              ]}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="value"
              name={showHeights ? "Altura" : "Tiempo de Vuelo"}
              barSize={100}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full mb-8 flex items-center justify-around">
        <OutlinedButton title="Volver" icon="back" onClick={onClose} inverse />
      </div>
    </div>
  );
}

export default BoscoComparisonChart;
