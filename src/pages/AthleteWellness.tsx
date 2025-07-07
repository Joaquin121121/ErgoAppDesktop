import { useNavigate } from "react-router-dom";
import TonalButton from "../components/TonalButton";
import React, { useEffect, useState } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import AutocompleteDropdown from "../components/AutocompleteDropdown";
import {
  formatIsoToSpanishDate,
  isSameWeek,
  ratioToPercentage,
} from "../utils/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { WellnessData, PerformanceData } from "../types/Athletes";

function AthleteWellness({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: any;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { athlete } = useStudyContext();
  const navigate = useNavigate();
  const onClose = () => {
    customNavigate("back", "athleteWellness", "athleteMenu");
    setTimeout(() => {
      navigate("/athleteMenu");
    }, 200);
  };

  const today = new Date();

  const [timeFrame, setTimeFrame] = useState<
    "lastMonth" | "lastTwoWeeks" | "lastWeek"
  >("lastMonth");

  const [wellnessDisplayFactors, setWellnessDisplayFactors] = useState<
    ("sleep" | "nutrition" | "fatigue")[]
  >(["sleep", "nutrition", "fatigue"]);

  const [performanceDisplayFactors, setPerformanceDisplayFactors] = useState<
    ("attendance" | "completedExercises" | "performance")[]
  >(["attendance", "completedExercises", "performance"]);

  const dropdownData = [
    {
      value: "lastMonth",
      label: "Último Mes",
    },
    {
      value: "lastTwoWeeks",
      label: "Últimas 2 Semanas",
    },
    {
      value: "lastWeek",
      label: "Última Semana",
    },
  ];

  const performanceData: PerformanceData[] =
    athlete.performanceData?.length > 0
      ? athlete.performanceData.map((p) => {
          return { ...p, week: new Date(p.week) };
        })
      : [
          {
            week: new Date(2025, 5, 30),
            attendance: "2/3",
            completedExercises: "8/10",
            performance: "7/8",
          },
          {
            week: new Date(2025, 5, 23),
            attendance: "2/3",
            completedExercises: "8/10",
            performance: "6/8",
          },
          {
            week: new Date(2025, 5, 16),
            attendance: "3/3",
            completedExercises: "7/10",
            performance: "5/7",
          },
          {
            week: new Date(2025, 5, 9),
            attendance: "2/3",
            completedExercises: "9/10",
            performance: "6/9",
          },
        ];

  const wellnessData: WellnessData[] =
    athlete.wellnessData?.length > 0
      ? athlete.wellnessData.map((p) => {
          return { ...p, week: new Date(p.week) };
        })
      : [
          {
            week: new Date(2025, 5, 30),
            sleep: 8,
            nutrition: 8,
            fatigue: 8,
          },
          {
            week: new Date(2025, 5, 23),
            sleep: 8,
            nutrition: 8,
            fatigue: 8,
          },
          {
            week: new Date(2025, 5, 16),
            sleep: 7,
            nutrition: 6,
            fatigue: 7,
          },
          {
            week: new Date(2025, 5, 9),
            sleep: 9,
            nutrition: 8,
            fatigue: 8,
          },
        ];

  const [displayWellnessData, setDisplayWellnessData] = useState(wellnessData);
  const [displayPerformanceData, setDisplayPerformanceData] =
    useState(performanceData);

  // General toggle function for performance display factors
  const togglePerformanceFactor = (
    factor: "attendance" | "completedExercises" | "performance"
  ) => {
    setPerformanceDisplayFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  // General toggle function for wellness display factors
  const toggleWellnessFactor = (factor: "sleep" | "nutrition" | "fatigue") => {
    setWellnessDisplayFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  // Transform data for charts
  const chartData = wellnessData
    .map((wellnessItem, index) => {
      const performanceItem = performanceData[index];
      return {
        week: new Date(wellnessItem.week)
          .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
          })
          .split("/")
          .reverse()
          .join("-"),
        fullDate: wellnessItem.week,
        // Wellness data
        sleep: wellnessItem.sleep,
        nutrition: wellnessItem.nutrition,
        fatigue: wellnessItem.fatigue,
        // Performance data
        attendance: ratioToPercentage(performanceItem.attendance),
        completedExercises: ratioToPercentage(
          performanceItem.completedExercises
        ),
        performance: ratioToPercentage(performanceItem.performance),
      };
    })
    .reverse(); // Reverse to show chronological order

  const handleTimeFrameChange = (
    value: "lastMonth" | "lastTwoWeeks" | "lastWeek"
  ) => {
    switch (value) {
      case "lastMonth":
        setDisplayWellnessData(wellnessData);
        setDisplayPerformanceData(performanceData);
        break;
      case "lastTwoWeeks":
        setDisplayWellnessData(wellnessData.slice(0, 2));
        setDisplayPerformanceData(performanceData.slice(0, 2));
        break;
      case "lastWeek":
        setDisplayWellnessData(wellnessData.slice(0, 1));
        setDisplayPerformanceData(performanceData.slice(0, 1));
        break;
    }
    setTimeFrame(value);
  };

  useEffect(() => {
    console.log(athlete);
  }, []);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center  transition-all duration-300 ease-in-out ${animation} `}
      style={{ paddingLeft: "9rem" }}
    >
      <TonalButton
        containerStyles="absolute top-8 right-8"
        onClick={onClose}
        icon="backWhite"
        title="Volver"
        inverse
      />
      <p className="text-3xl my-10">
        Bienestar y Rendimiento:{" "}
        <span className="text-secondary">{athlete.name}</span>
      </p>
      <div className="flex justify-center items-center gap-x-8">
        <p className="text-lg text-darkGray">Mostrando</p>
        <AutocompleteDropdown
          className="bg-white "
          data={dropdownData}
          onSelect={(value) => handleTimeFrameChange(value)}
          field="timeFrame"
          displayKey="label"
          valueKey="value"
          placeholder="Seleccione un periodo"
          disabled={false}
          reset={false}
          setReset={() => {}}
          initialQuery={
            dropdownData.find((item) => item.value === timeFrame)?.label ||
            undefined
          }
        />
      </div>
      <div className="flex justify-center pr-4 gap-x-8 mt-8 w-full">
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center px-8 ">
          <div className="flex items-center justify-center mt-6 gap-x-4">
            <p className="text-secondary text-2xl">Bienestar</p>
            <img src="wellness.png" alt="" className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-x-4 mt-10 py-[14px] ">
            <p className="col-span-1 text-darkGray text-center w-36 text-lg flex items-center justify-center">
              Semana
            </p>
            <p
              className="col-span-1 text-center w-24 text-lg flex items-center justify-center"
              style={{ color: "#3B82F6" }}
            >
              Sueño
            </p>
            <p
              className="col-span-1 text-center w-24 text-lg flex items-center justify-center"
              style={{ color: "#10B981" }}
            >
              Nutrición
            </p>
            <p
              className="col-span-1 text-center w-24 text-lg flex items-center justify-center"
              style={{ color: "#F59E0B" }}
            >
              Fatiga
            </p>
          </div>
          {displayWellnessData.map((item) => (
            <div className="flex items-center gap-x-4 mt-6">
              <p className="col-span-1 text-darkGray w-36 flex items-center justify-center text-center text-lg ">
                {isSameWeek(
                  new Date(item.week).toISOString(),
                  today.toISOString()
                )
                  ? "Esta Semana"
                  : "Semana del " + formatIsoToSpanishDate(item.week)}
              </p>
              <p className="col-span-1 w-24 flex items-center justify-center text-center text-xl ">
                {item.sleep}
              </p>
              <p className="col-span-1 w-24 flex items-center justify-center text-center text-xl ">
                {item.nutrition}
              </p>
              <p className="col-span-1 w-24 flex items-center justify-center text-center text-xl ">
                {item.fatigue}
              </p>
            </div>
          ))}
          <div className="w-3/4 my-8">
            <p className="text-darkGray text-lg ">Mostrar</p>
            <div className="flex items-center gap-x-4 mt-2">
              <button
                className={`rounded-2xl px-4 py-1 text-sm flex  items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  wellnessDisplayFactors.includes("sleep")
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => toggleWellnessFactor("sleep")}
              >
                Sueño
              </button>
              <button
                className={`rounded-2xl px-4 py-1 text-sm flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  wellnessDisplayFactors.includes("nutrition")
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => toggleWellnessFactor("nutrition")}
              >
                Nutrición
              </button>
              <button
                className={`rounded-2xl px-4 py-1 text-sm flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  wellnessDisplayFactors.includes("fatigue")
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => toggleWellnessFactor("fatigue")}
              >
                Fatiga
              </button>
            </div>
          </div>

          {/* Wellness Chart */}
          <div className="w-full pb-6">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${Math.round(Number(value))}`,
                      name,
                    ]}
                  />
                  <Legend />
                  {wellnessDisplayFactors.includes("sleep") && (
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Sueño"
                    />
                  )}
                  {wellnessDisplayFactors.includes("nutrition") && (
                    <Line
                      type="monotone"
                      dataKey="nutrition"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Nutrición"
                    />
                  )}
                  {wellnessDisplayFactors.includes("fatigue") && (
                    <Line
                      type="monotone"
                      dataKey="fatigue"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Fatiga"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center px-8 ">
          <div className="flex items-center justify-center mt-6 gap-x-4">
            <p className="text-secondary text-2xl ">Rendimiento</p>
            <img src="athletePerformance.png" alt="" className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-x-4 mt-10 ">
            <p className=" text-darkGray text-center w-36 text-lg flex items-center justify-center">
              Semana
            </p>
            <p
              className=" text-center w-24 text-lg flex items-center justify-center"
              style={{ color: "#14B8A6" }}
            >
              Asistencia
            </p>
            <p
              className=" text-center w-48 text-lg flex items-center justify-center"
              style={{ color: "#8B5CF6" }}
            >
              Ejercicios Completados
            </p>
            <p
              className=" text-center w-28 text-lg flex items-center justify-center"
              style={{ color: "#F97316" }}
            >
              Rendimiento
            </p>
          </div>
          {displayPerformanceData.map((item) => (
            <div className="flex items-center gap-x-4  mt-6">
              <p className=" text-darkGray w-36 flex items-center justify-center text-center text-lg ">
                {isSameWeek(
                  new Date(item.week).toISOString(),
                  today.toISOString()
                )
                  ? "Esta Semana"
                  : "Semana del " + formatIsoToSpanishDate(item.week)}
              </p>
              <p className=" w-24 flex items-center justify-center text-center text-xl ">
                {item.attendance}
              </p>
              <p className=" w-48 flex items-center justify-center text-center text-xl ">
                {item.completedExercises}
              </p>
              <p className=" w-28 flex items-center justify-center text-center text-xl ">
                {item.performance}
              </p>
            </div>
          ))}
          <div className="w-3/4 my-8">
            <p className="text-darkGray text-lg">Mostrar</p>
            <div className="flex items-center gap-x-4 mt-2">
              <button
                className={`rounded-2xl px-4 py-1 text-sm flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  performanceDisplayFactors.includes("attendance")
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => togglePerformanceFactor("attendance")}
              >
                Asistencia
              </button>
              <button
                className={`rounded-2xl px-4 py-1 text-sm flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none whitespace-nowrap ${
                  performanceDisplayFactors.includes("completedExercises")
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => togglePerformanceFactor("completedExercises")}
              >
                Ejercicios Completados
              </button>
              <button
                className={`rounded-2xl px-4 py-1 text-sm flex items-center justify-center font-light ml-4 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                  performanceDisplayFactors.includes("performance")
                    ? "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    : ""
                }`}
                onClick={() => togglePerformanceFactor("performance")}
              >
                Rendimiento
              </button>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="w-full px-6 pb-6">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${Math.round(Number(value))}%`,
                      name,
                    ]}
                  />
                  <Legend />
                  {performanceDisplayFactors.includes("attendance") && (
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#14B8A6"
                      strokeWidth={2}
                      name="Asistencia"
                    />
                  )}
                  {performanceDisplayFactors.includes("completedExercises") && (
                    <Line
                      type="monotone"
                      dataKey="completedExercises"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Ejercicios Completados"
                    />
                  )}
                  {performanceDisplayFactors.includes("performance") && (
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#F97316"
                      strokeWidth={2}
                      name="Rendimiento"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AthleteWellness;
