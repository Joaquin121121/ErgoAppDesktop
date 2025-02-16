import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
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
import animations from "../styles/animations.module.css";
function MultipleJumpsChartDisplay({
  setShowChart,
  jumpTimes,
  setShowTable,
  chartAnimation,
  onClose,
  displayTable,
}: {
  setShowChart: (show: boolean) => void;
  jumpTimes: JumpTime[];
  setShowTable?: (show: boolean) => void;
  chartAnimation: string;
  onClose: () => void;
  displayTable?: () => void;
}) {
  const validJumpTimes = jumpTimes.filter((e) => !e.deleted);

  const timesData = validJumpTimes.map((jumpTime, i) => ({
    index: i,
    flightTime: Number(jumpTime.time.toFixed(2)),
    floorTime: Number(jumpTime.floorTime.toFixed(2)),
    qIndex: Number((jumpTime.time / jumpTime.floorTime).toFixed(2)),
  }));

  const heightData = validJumpTimes.map((jumpTime, i) => ({
    index: i,
    height: Number((((9.81 * jumpTime.time ** 2) / 8) * 100).toFixed(1)),
    qIndex: Number((jumpTime.time / jumpTime.floorTime).toFixed(2)),
  }));

  const [buttonText, setButtonText] = useState("Alturas");
  const [data, setData] = useState<any>(timesData);

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
      <div className="w-1/2 flex items-center justify-center">
        <p className="text-3xl text-secondary mr-16 ">
          Gráfico de {buttonText === "Alturas" ? "Tiempos" : "Alturas"}
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
              yAxisId="left"
              label={{
                value: buttonText === "Alturas" ? "Tiempo (s)" : "Altura (cm)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: "Índice Q",
                angle: 90,
                position: "insideRight",
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
                  yAxisId="left"
                  dataKey="flightTime"
                  fill="#e81d23"
                  name="Tiempo de Vuelo"
                  barSize={20}
                />
                <Bar
                  yAxisId="left"
                  dataKey="floorTime"
                  fill="#FFC1C1"
                  name="Tiempo de Piso"
                  barSize={20}
                />
              </>
            ) : (
              <Bar
                yAxisId="left"
                dataKey="height"
                fill="#e81d23"
                name="Altura"
                barSize={20}
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="qIndex"
              stroke="#ff7300"
              name="Índice Q"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full mb-8 flex items-center justify-around">
        <OutlinedButton title="Volver" icon="back" onClick={onClose} inverse />

        {setShowTable && (
          <TonalButton
            title="Ver Tabla"
            icon="table"
            onClick={() => {
              onClose();
              displayTable();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default MultipleJumpsChartDisplay;
