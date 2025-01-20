import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStudyContext } from "../contexts/StudyContext";
import { useTranslation } from "react-i18next";
import TonalButton from "../components/TonalButton";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import { Athlete, transformToAthlete, isAthlete } from "../types/Athletes";
import inputStyles from "../styles/inputStyles.module.css";

function NewAthlete({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const inputRef = useRef(null);

  const [loadedAthletes, setLoadedAthletes] = useState<Athlete[]>([]);

  const [athlete, setAthlete] = useState<Athlete>({
    name: "",
    birthDate: new Date(),
    country: "",
    state: "",
    gender: "male",
    height: "",
    heightUnit: "cm",
    weight: 70,
    weightUnit: "kgs",
    discipline: "",
    category: "",
    institution: "",
    comments: "",
  });

  const [errors, setErrors] = useState<Record<keyof Athlete, string>>({
    name: "",
    birthDate: "",
    country: "",
    state: "",
    gender: "",
    height: "",
    heightUnit: "",
    weight: "",
    weightUnit: "",
    discipline: "",
    category: "",
    institution: "",
    comments: "",
  });

  // Store previous values for conversion calculations
  const [prevHeight, setPrevHeight] = useState<string>("");
  const [prevHeightUnit, setPrevHeightUnit] = useState<"cm" | "ft" | "">("");
  const [prevWeightUnit, setPrevWeightUnit] = useState<"kgs" | "lbs" | "">("");

  const { saveJson, readDirectoryJsons } = useJsonFiles();

  const onClose = () => {
    customNavigate("back", "newAthlete", "startTest");
    setTimeout(() => {
      navigate("/startTest");
    }, 300);
  };

  const togglePicker = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const handleInputChange = (field: keyof Athlete, value: string | Date) => {
    if (
      (field === "weight" || field === "height") &&
      value !== "" &&
      !/^\d+$/.test(String(value))
    ) {
      return;
    }
    setAthlete({ ...athlete, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const loadAthletes = async () => {
    try {
      const result = await readDirectoryJsons("athletes");
      const parsedAthletes = result.files
        .map((item) => transformToAthlete(item.content)) // Access the content property
        .filter((athlete): athlete is Athlete => athlete !== null);

      console.log("Final parsed athletes:", parsedAthletes);
      setLoadedAthletes(parsedAthletes);
    } catch (error) {
      console.log(error);
    }
  };
  const saveAthlete = async () => {
    if (athlete.name === "") {
      setErrors({ ...errors, name: "empty" });
      return;
    }
    if (athlete.discipline === "") {
      setErrors({ ...errors, discipline: "empty" });
      return;
    }
    if (athlete.country === "") {
      setErrors({ ...errors, country: "empty" });
      return;
    }
    if (athlete.state === "") {
      setErrors({ ...errors, state: "empty" });
      return;
    }
    if (athlete.institution === "") {
      setErrors({ ...errors, institution: "empty" });
      return;
    }

    if (loadedAthletes.some((e) => e.name === athlete.name)) {
      setErrors({ ...errors, name: "duplicate" });
      return;
    }

    try {
      const result = await saveJson(
        `${naturalToCamelCase(athlete.name)}.json`,
        athlete,
        "athletes"
      );
      console.log(result.message);
      customNavigate("back", "newAthlete", "startTest");
      setTimeout(() => {
        navigate("/startTest");
      }, 300);
    } catch (error) {
      console.log(error);
    }
  };

  // Auto-format height when typing in feet mode
  useEffect(() => {
    if (
      athlete.heightUnit === "ft" &&
      athlete.height.length === 1 &&
      prevHeight.length === 0
    ) {
      setAthlete({ ...athlete, height: `${athlete.height}'` });
    }
    setPrevHeight(athlete.height);
  }, [athlete.height]);

  // Handle height unit conversion
  useEffect(() => {
    if (athlete.heightUnit === "ft" && prevHeightUnit === "cm") {
      const heightNum = parseFloat(athlete.height);
      if (!isNaN(heightNum)) {
        const feet = Math.floor(heightNum / 30.48);
        const inches = Math.round((heightNum % 30.48) / 2.54);
        setAthlete({ ...athlete, height: `${feet}'${inches}` });
      }
    }
    if (athlete.heightUnit === "cm" && prevHeightUnit === "ft") {
      const [feet, inches = "0"] = athlete.height.split("'");
      const feetNum = parseInt(feet);
      const inchesNum = parseInt(inches);
      if (!isNaN(feetNum) && !isNaN(inchesNum)) {
        const newHeight = Math.round(
          feetNum * 30.48 + inchesNum * 2.54
        ).toString();
        setAthlete({ ...athlete, height: newHeight });
      }
    }
  }, [athlete.heightUnit]);

  // Handle weight unit conversion
  useEffect(() => {
    if (prevWeightUnit === "kgs" && athlete.weightUnit === "lbs") {
      const weightNum = athlete.weight;
      if (!isNaN(weightNum)) {
        setAthlete({
          ...athlete,
          weight: Math.round(2.2 * weightNum),
        });
      }
    }
    if (prevWeightUnit === "lbs" && athlete.weightUnit === "kgs") {
      const weightNum = athlete.weight;
      if (!isNaN(weightNum)) {
        setAthlete({
          ...athlete,
          weight: Math.round(0.45392 * weightNum),
        });
      }
    }
  }, [athlete.weightUnit]);

  useEffect(() => {
    loadAthletes();
  }, []);

  return (
    <div
      className="flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out"
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 transition-all 300 ease-in-out ${animation}`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="close" />
        </div>

        <p className="text-3xl text-secondary self-center -mt-10">
          Añadir Atleta
        </p>
        <p className="text-4xl mt-8 text-black">Datos del Atleta</p>

        <div className="flex w-full mt-8">
          {/* Left Column */}
          <div className="flex flex-col w-1/2">
            {/* Name */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("name").charAt(0).toUpperCase() + t("name").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                  inputStyles.input
                } ${errors.name && inputStyles.focused}`}
                placeholder={
                  t("name").charAt(0).toUpperCase() + t("name").slice(1) + "..."
                }
                value={athlete.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            {errors.name === "duplicate" && (
              <p className="text-secondary -mt-1 self-center">
                El atleta ya existe
              </p>
            )}
            {/* Birth Date */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("birthDate").charAt(0).toUpperCase() +
                  t("birthDate").slice(1)}
              </p>
              <div
                className={`bg-offWhite y rounded-2xl flex items-center justify-between w-48 shadow-sm pl-2 pr-1 h-10 text-black ${
                  inputStyles.input
                } ${errors.birthDate && inputStyles.focused}`}
              >
                <input
                  type="date"
                  ref={inputRef}
                  className={`w-3/5 h-full bg-inherit focus:outline-none  text-black [&::-webkit-calendar-picker-indicator]:hidden`}
                  value={
                    athlete.birthDate instanceof Date
                      ? athlete.birthDate.toISOString().split("T")[0]
                      : athlete.birthDate
                  }
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                />
                <img
                  src="/calendar.png"
                  alt=""
                  className="cursor-pointer w-6 h-6 "
                  onClick={togglePicker}
                />
              </div>
            </div>
            {/* Country */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("country").charAt(0).toUpperCase() + t("country").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                  inputStyles.input
                } ${errors.country && inputStyles.focused}`}
                placeholder={
                  t("country").charAt(0).toUpperCase() +
                  t("country").slice(1) +
                  "..."
                }
                value={athlete.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              />
            </div>
            {/* State */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("state").charAt(0).toUpperCase() + t("state").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                  inputStyles.input
                } ${errors.state && inputStyles.focused}`}
                placeholder={
                  t("state").charAt(0).toUpperCase() +
                  t("state").slice(1) +
                  "..."
                }
                value={athlete.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
              />
            </div>

            {/* Gender */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">Género</p>
              <select
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black
                  [&>option]:bg-offWhite
                  [&>option:hover]:bg-lightRed [&>option:hover]:text-secondary
                  [&>option:checked]:bg-lightRed [&>option:checked]:text-secondary
                  ${inputStyles?.input}
                  ${errors.birthDate && inputStyles?.focused}`}
                value={athlete.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          {/* Right Column */}

          <div className="flex flex-col w-1/2">
            {/* Height with Units */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("height").charAt(0).toUpperCase() + t("height").slice(1)}
              </p>
              <div className="flex items-center">
                <input
                  type="numeric"
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-black mr-4 ${
                    inputStyles.input
                  } ${errors.height && inputStyles.focused}`}
                  placeholder={
                    t("height").charAt(0).toUpperCase() +
                    t("height").slice(1) +
                    "..."
                  }
                  value={athlete.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                />
                <button
                  onClick={() => handleInputChange("heightUnit", "cm")}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light mr-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    athlete.heightUnit === "cm" &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  Cm
                </button>
                <button
                  onClick={() => handleInputChange("heightUnit", "ft")}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    athlete.heightUnit === "ft" &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  Ft
                </button>
              </div>
            </div>
            {/* Weight with Units */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("weight").charAt(0).toUpperCase() + t("weight").slice(1)}
              </p>
              <div className="flex items-center">
                <input
                  type="numeric"
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-black mr-4 ${
                    inputStyles.input
                  } ${errors.weight && inputStyles.focused}`}
                  placeholder={
                    t("weight").charAt(0).toUpperCase() +
                    t("weight").slice(1) +
                    "..."
                  }
                  value={athlete.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                />
                <button
                  onClick={() => handleInputChange("weightUnit", "kgs")}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light mr-2 text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    athlete.weightUnit === "kgs" &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  Kgs
                </button>
                <button
                  onClick={() => handleInputChange("weightUnit", "lbs")}
                  className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                    athlete.weightUnit === "lbs" &&
                    "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                  }`}
                >
                  Lbs
                </button>
              </div>
            </div>

            {/* Discipline */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("discipline").charAt(0).toUpperCase() +
                  t("discipline").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                  inputStyles.input
                } ${errors.discipline && inputStyles.focused}`}
                placeholder={
                  t("discipline").charAt(0).toUpperCase() +
                  t("discipline").slice(1) +
                  "..."
                }
                value={athlete.discipline}
                onChange={(e) =>
                  handleInputChange("discipline", e.target.value)
                }
              />
            </div>

            {/* Category */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("category").charAt(0).toUpperCase() + t("category").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                  inputStyles.input
                } ${errors.category && inputStyles.focused}`}
                placeholder={
                  t("category").charAt(0).toUpperCase() +
                  t("category").slice(1) +
                  "..."
                }
                value={athlete.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              />
            </div>

            {/* Institution */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("institution").charAt(0).toUpperCase() +
                  t("institution").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                  inputStyles.input
                } ${errors.institution && inputStyles.focused}`}
                placeholder={
                  t("institution").charAt(0).toUpperCase() +
                  t("institution").slice(1) +
                  "..."
                }
                value={athlete.institution}
                onChange={(e) =>
                  handleInputChange("institution", e.target.value)
                }
              />
            </div>
          </div>
        </div>
        <p className="w-40 text-right mr-8 text-darkGray mt-4">Comentarios</p>
        <textarea
          name=""
          id=""
          className={`bg-offWhite shadow-sm rounded-2xl h-20 p-2 text-black mt-2 w-3/4 self-center ${inputStyles.input}`}
        ></textarea>
        <TonalButton
          containerStyles="self-center my-8"
          title="Guardar Atleta"
          icon="next"
          onClick={saveAthlete}
        />
      </div>
    </div>
  );
}

export default NewAthlete;
