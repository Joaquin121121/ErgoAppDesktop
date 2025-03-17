import React from "react";
import { JumpTime } from "../../types/Studies";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { ComposedChart } from "recharts";
import { ResponsiveContainer } from "recharts";

function MultipleJumpsChart({
  jumpTimes,
  displayMetric = "heightReached",
}: {
  jumpTimes: JumpTime[];
  displayMetric?: "heightReached" | "times" | "performance";
}) {
  const chartData = jumpTimes.map((jumpTime, index) => ({
    index: index + 1,
    flightTime: jumpTime.time,
    floorTime: jumpTime.floorTime,
    heightReached: jumpTime.heightReached,
  }));

  const renderMetricBars = (
    displayMetric: "times" | "heightReached" | "performance"
  ) => {
    switch (displayMetric) {
      case "times":
        return (
          <>
            <Bar
              yAxisId="left"
              dataKey="flightTime"
              fill="#e81d23"
              name="Tiempo de Vuelo"
              barSize={20}
              animationDuration={500}
              animationEasing="ease"
            />
            <Bar
              yAxisId="left"
              dataKey="floorTime"
              fill="#FFC1C1"
              name="Tiempo de Piso"
              barSize={20}
              animationDuration={500}
              animationEasing="ease"
            />
          </>
        );

      case "heightReached":
        return (
          <Bar
            yAxisId="left"
            dataKey="heightReached"
            fill="#e81d23"
            name="Altura"
            barSize={20}
            animationDuration={500}
            animationEasing="ease"
          />
        );

      case "performance":
        return (
          <Bar
            yAxisId="left"
            dataKey="performance"
            fill="#e81d23"
            name="Rendimiento"
            barSize={20}
            animationDuration={500}
            animationEasing="ease"
          />
        );
    }
  };

  return (
    <div className="w-full" style={{ height: "500px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
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
              value:
                displayMetric === "times"
                  ? "Tiempo (s)"
                  : displayMetric === "heightReached"
                  ? "Altura (cm)"
                  : "Rendimiento (%)",
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
          {renderMetricBars(displayMetric)}
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
  );
}

export default MultipleJumpsChart;
