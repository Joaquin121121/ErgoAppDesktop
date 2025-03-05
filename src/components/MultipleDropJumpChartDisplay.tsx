import React, { useEffect, useState } from "react";
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
import { DropJumpResult, units } from "../types/Studies";
import animations from "../styles/animations.module.css";
import { useTranslation } from "react-i18next";

function MultipleDropJumpChartDisplay({
  setShowChart,
  dropJumps,
  chartAnimation,
  onClose,
}: {
  setShowChart: (show: boolean) => void;
  dropJumps: DropJumpResult[];
  chartAnimation: string;
  onClose: () => void;
}) {
  // Add DEL key event listener

  // Prepare data for the charts
  const heightData = dropJumps.map((jump, i) => ({
    index: i,
    height: Number(jump.avgHeightReached.toFixed(1)),
    dropHeight: jump.height,
    label: `${jump.height} cm`,
  }));

  const { t } = useTranslation();

  const [data, setData] = useState<any>(heightData);
  const [displayMetric, setDisplayMetric] = useState<"height" | "time">(
    "height"
  );

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
      <div className="w-3/4 flex items-center justify-center">
        <p className="text-3xl text-secondary mr-16 ">
          {displayMetric === "height"
            ? "Altura de Salto por Altura de Caída"
            : "Tiempo de Vuelo por Altura de Caída"}
          {` (${units[displayMetric]})`}
        </p>
      </div>
      <div className="w-full" style={{ height: "600px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 60, bottom: 60, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              label={{
                value: "Altura de Caída (cm)",
                position: "bottom",
                offset: 0,
              }}
            />
            <YAxis
              label={{
                value:
                  displayMetric === "height"
                    ? "Altura de Salto (cm)"
                    : "Tiempo de Vuelo (s)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              }}
              formatter={(value, name) => {
                if (name === "height")
                  return [`${value} cm`, "Altura de Salto"];
                if (name === "flightTime")
                  return [`${value} s`, "Tiempo de Vuelo"];
                return [value, name];
              }}
              labelFormatter={(label) => `Altura de Caída: ${label}`}
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
            {displayMetric === "height" ? (
              <Bar
                dataKey="height"
                fill="#e81d23"
                name="Altura de Salto"
                barSize={60}
                animationDuration={500}
                animationEasing="ease"
              />
            ) : (
              <Bar
                dataKey="flightTime"
                fill="#e81d23"
                name="Tiempo de Vuelo"
                barSize={60}
                animationDuration={500}
                animationEasing="ease"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <TonalButton
        inverse
        icon="backWhite"
        title="Volver"
        onClick={onClose}
        containerStyles="self-center mb-4"
      />
    </div>
  );
}

export default MultipleDropJumpChartDisplay;
