import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";
import TonalButton from "./TonalButton";
import OutlinedButton from "./OutlinedButton";
import { JumpTime } from "../types/Studies";
import { useTranslation } from "react-i18next";

function ComparisonChartDisplay({
  setShowChart,
  jumpTimesA,
  jumpTimesB,
  jumpTimesC,
  stiffnessA,
  stiffnessB,
  stiffnessC,
  chartAnimation,
  onClose,
  type1,
  type2,
  type3,
  showStiffness = false,
}: {
  setShowChart: (show: boolean) => void;
  jumpTimesA: JumpTime[];
  jumpTimesB: JumpTime[];
  jumpTimesC?: JumpTime[];
  stiffnessA?: number[];
  stiffnessB?: number[];
  stiffnessC?: number[];
  chartAnimation: string;
  onClose: () => void;
  type1: string;
  type2: string;
  type3?: string;
  showStiffness?: boolean;
}) {
  const validJumpTimesA = jumpTimesA.filter((e) => !e.deleted);
  const validJumpTimesB = jumpTimesB.filter((e) => !e.deleted);
  const validJumpTimesC = jumpTimesC?.filter((e) => !e.deleted) || [];

  const maxLength = Math.max(
    validJumpTimesA.length,
    validJumpTimesB.length,
    validJumpTimesC.length
  );

  const barWidth = 240 / maxLength;

  const heightData = Array.from({ length: maxLength }, (_, i) => ({
    index: i,
    heightA: validJumpTimesA[i]
      ? Number((((9.81 * validJumpTimesA[i].time ** 2) / 8) * 100).toFixed(2))
      : null,
    heightB: validJumpTimesB[i]
      ? Number((((9.81 * validJumpTimesB[i].time ** 2) / 8) * 100).toFixed(2))
      : null,
    heightC: validJumpTimesC[i]
      ? Number((((9.81 * validJumpTimesC[i].time ** 2) / 8) * 100).toFixed(2))
      : null,
    stiffnessA: stiffnessA?.[i] || null,
    stiffnessB: stiffnessB?.[i] || null,
    stiffnessC: stiffnessC?.[i] || null,
  }));

  // Calculate averages for each dataset
  const avgHeightA =
    validJumpTimesA.length > 0
      ? Number(
          (
            validJumpTimesA.reduce(
              (sum, jump) => sum + ((9.81 * jump.time ** 2) / 8) * 100,
              0
            ) / validJumpTimesA.length
          ).toFixed(2)
        )
      : 0;
  const avgHeightB =
    validJumpTimesB.length > 0
      ? Number(
          (
            validJumpTimesB.reduce(
              (sum, jump) => sum + ((9.81 * jump.time ** 2) / 8) * 100,
              0
            ) / validJumpTimesB.length
          ).toFixed(2)
        )
      : 0;
  const avgHeightC =
    validJumpTimesC.length > 0
      ? Number(
          (
            validJumpTimesC.reduce(
              (sum, jump) => sum + ((9.81 * jump.time ** 2) / 8) * 100,
              0
            ) / validJumpTimesC.length
          ).toFixed(2)
        )
      : 0;

  const averageHeightData = [
    {
      index: 0,
      heightA: validJumpTimesA.length > 0 ? avgHeightA : null,
      heightB: validJumpTimesB.length > 0 ? avgHeightB : null,
      heightC: validJumpTimesC.length > 0 ? avgHeightC : null,
      stiffnessA: null,
      stiffnessB: null,
      stiffnessC: null,
    },
  ];

  const [buttonText, setButtonText] = useState("Individuales");
  const [data, setData] = useState<any>(averageHeightData);
  const { t } = useTranslation();

  const toggleGraph = () => {
    if (buttonText === "Promedios") {
      setData(averageHeightData);
      setButtonText("Individuales");
    } else {
      setData(heightData);
      setButtonText("Promedios");
    }
  };

  // Add DEL key event listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger onClose if Backspace is pressed AND no input/textarea is focused
      if (
        event.key === "Backspace" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName
        )
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
          {buttonText === "Promedios"
            ? "Alturas Individuales"
            : "Promedios de Alturas"}
        </p>
        {
          <TonalButton
            title={"Ver " + buttonText}
            onClick={toggleGraph}
            icon="studies"
          />
        }
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
                value:
                  buttonText === "Individuales" ? "Promedio" : "N° de Salto",
                position: "bottom",
                offset: 0,
              }}
            />
            <YAxis
              label={{
                value: "Altura (cm)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            {showStiffness && (
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Stiffness",
                  angle: 90,
                  position: "insideRight",
                }}
              />
            )}
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
            <Bar
              dataKey="heightA"
              fill="#e81d23"
              name={`${t(type1)} ${
                type1 === type2 || type1 === type3 ? "A" : ""
              }`}
              barSize={buttonText === "Individuales" ? 240 : barWidth}
            />
            <Bar
              dataKey="heightB"
              fill="#FFC1C1"
              name={`${t(type2)} ${
                type1 === type2 || type2 === type3 ? "B" : ""
              }`}
              barSize={buttonText === "Individuales" ? 240 : barWidth}
            />
            {jumpTimesC && (
              <Bar
                dataKey="heightC"
                fill="#FF7F7F"
                name={`${t(type3!)} ${
                  type1 === type3 || type2 === type3 ? "C" : ""
                }`}
                barSize={buttonText === "Individuales" ? 240 : barWidth}
              />
            )}
            {showStiffness && (
              <>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stiffnessA"
                  stroke="#FF9501"
                  strokeWidth={2}
                  dot={{ fill: "#FF9501" }}
                  name={`Stiffness ${t(type1)} ${
                    type1 === type2 || type1 === type3 ? "A" : ""
                  }`}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stiffnessB"
                  stroke="#FFD700"
                  strokeWidth={2}
                  dot={{ fill: "#FFD700" }}
                  name={`Stiffness ${t(type2)} ${
                    type1 === type2 || type2 === type3 ? "B" : ""
                  }`}
                />
                {jumpTimesC && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="stiffnessC"
                    stroke="#FFF2B2"
                    strokeWidth={2}
                    dot={{ fill: "#FFF2B2" }}
                    name={`Stiffness ${t(type3!)} ${
                      type1 === type3 || type2 === type3 ? "C" : ""
                    }`}
                  />
                )}
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
