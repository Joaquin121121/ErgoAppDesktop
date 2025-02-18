import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStudyContext } from "../contexts/StudyContext";
import { useTranslation } from "react-i18next";
import TonalButton from "../components/TonalButton";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import { Athlete, transformToAthlete } from "../types/Athletes";
import inputStyles from "../styles/inputStyles.module.css";
import AutocompleteDropdown from "../components/AutocompleteDropdown";
import { Country, State } from "country-state-city";
import { formattedDisciplines } from "../constants/data";
import { useSearchParams } from "react-router-dom";
import { VALIDATION_LIMITS } from "../constants/data";
import navAnimation from "../styles/animations.module.css";
import OutlinedButton from "../components/OutlinedButton";
function NewAthlete({
  isExpanded,
  animation,
  customNavigate,
  onBlurChange,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  onBlurChange: (showInfo: boolean) => void;
}) {
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");

  const navigate = useNavigate();

  const inputRef = useRef(null);

  const [loadedAthletes, setLoadedAthletes] = useState<Athlete[]>([]);

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
    completedStudies: "",
  });

  // Store previous values for conversion calculations
  const [prevHeight, setPrevHeight] = useState<string>("");
  const [prevHeightUnit, setPrevHeightUnit] = useState<"cm" | "ft" | "">("");
  const [prevWeightUnit, setPrevWeightUnit] = useState<"kgs" | "lbs" | "">("");
  const [statesList, setStatesList] = useState([]);
  const [countryReset, setCountryReset] = useState(false);
  const [stateReset, setStateReset] = useState(false);
  const [genderReset, setGenderReset] = useState(false);
  const [disciplineReset, setDisciplineReset] = useState(false);
  const [fastLoad, setFastLoad] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [lockedFields, setLockedFields] = useState<string[]>([]);
  const [athletesToSave, setAthletesToSave] = useState<Athlete[]>([]);
  const [currentAthleteIndex, setCurrentAthleteIndex] = useState(0);
  const [fieldsAnimation, setFieldsAnimation] = useState("");

  const { saveJson, readDirectoryJsons } = useJsonFiles();
  const { athlete, setAthlete, resetAthlete } = useStudyContext();

  const countries = Country.getAllCountries()
    .map((country) => ({
      ...country,
      name:
        new Intl.DisplayNames(["es"], { type: "region" }).of(country.isoCode) ||
        country.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const genders = [
    { name: "Femenino", isoCode: "F" },
    { name: "Masculino", isoCode: "M" },
    { name: "Otro", isoCode: "O" },
  ];

  const onClose = () => {
    resetAthlete();
    customNavigate("back", "newAthlete", from ? "athletes" : "startTest");
    setTimeout(() => {
      navigate(from ? "/athletes" : "/startTest");
    }, 300);
  };

  const togglePicker = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const deleteAthlete = () => {
    if (athletesToSave.length > 0) {
      setAthletesToSave(athletesToSave.slice(0, -1));
      setCurrentAthleteIndex(currentAthleteIndex - 1);
    } else {
      setCountryReset(true);
      setStateReset(true);
      setGenderReset(true);
      setDisciplineReset(true);
      resetAthlete();
    }
  };

  const onNext = () => {
    setAthletesToSave([...athletesToSave, athlete]);
    deleteAthlete();

    setCurrentAthleteIndex(currentAthleteIndex + 1);
    setFieldsAnimation(navAnimation.fadeOutLeft);
    setTimeout(() => {
      setFieldsAnimation(navAnimation.fadeInRight);
    }, 300);
  };

  const onBack = () => {
    if (athletesToSave.length === 0) {
      return;
    }
    setCurrentAthleteIndex(currentAthleteIndex - 1);

    setFieldsAnimation(navAnimation.fadeOutRight);
    setTimeout(() => {
      setFieldsAnimation(navAnimation.fadeInLeft);
    }, 300);
  };

  useEffect(() => {
    if (countryReset) {
      setStateReset(true);
    }
  }, [countryReset]);

  const handleInputChange = (field: keyof Athlete, value: string | Date) => {
    if (field === "name" && typeof value === "string" && /\d/.test(value)) {
      setErrors({ ...errors, name: "numbers" });
      return;
    }
    if (
      field === "height" &&
      athlete.heightUnit === "ft" &&
      typeof value === "string" &&
      value.length > 0
    ) {
      // Split the value into an array of characters
      const chars = value.split("");

      // If length is 4 (e.g., "5'11"), check if the second to last char is '1'
      // and the last char is between '0' and '1'
      if (value.length === 4) {
        const secondToLast = chars[value.length - 2];
        const last = chars[value.length - 1];

        if (secondToLast !== "1" || (last !== "0" && last !== "1")) {
          return;
        }
      }

      // Don't allow inputs longer than 4 characters (e.g., "5'111")
      if (value.length > 4) {
        return;
      }
    }
    if (
      (field === "weight" || field === "height") &&
      value !== "" &&
      !/^\d+$/.test(String(value)) &&
      // Allow the feet/inches format (e.g., "5'11")
      !(
        field === "height" &&
        athlete.heightUnit === "ft" &&
        /^\d'?\d*$/.test(String(value))
      )
    ) {
      return;
    }

    if (field === "height" && typeof value === "string" && value !== "") {
      if (athlete.heightUnit === "cm") {
        const numValue = parseFloat(value);
        if (numValue > VALIDATION_LIMITS.height.cm.max) {
          return;
        }
      } else if (athlete.heightUnit === "ft") {
        const [feet, inches = "0"] = value.split("'");
        const feetNum = parseInt(feet);
        const inchesNum = parseInt(inches);
        if (!isNaN(feetNum) && !isNaN(inchesNum)) {
          const newHeight = Math.round(feetNum * 30.48 + inchesNum * 2.54);
          if (newHeight > VALIDATION_LIMITS.height.cm.max) {
            return;
          }
        }
        // Only validate the feet part when there's a single digit
        if (
          value.length === 1 &&
          parseInt(value) > VALIDATION_LIMITS.height.ft.max
        ) {
          return;
        }
      }
    }

    if (field === "weight" && typeof value === "string" && value !== "") {
      const numValue = parseFloat(value);
      const maxValue =
        VALIDATION_LIMITS.weight[athlete.weightUnit as "kgs" | "lbs"].max;
      if (numValue > maxValue) {
        return;
      }
    }

    if (field === "heightUnit") {
      setPrevHeightUnit(athlete.heightUnit);
    }
    if (field === "weightUnit") {
      setPrevWeightUnit(athlete.weightUnit);
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
    if (athlete.country === "") {
      setErrors({ ...errors, country: "empty" });
      return;
    }
    if (athlete.state === "" && statesList.length > 0) {
      setErrors({ ...errors, state: "empty" });
      return;
    }
    if (athlete.gender === "") {
      setErrors({ ...errors, gender: "empty" });
      return;
    }
    if (athlete.height === "") {
      setErrors({ ...errors, height: "empty" });
      return;
    }
    if (athlete.weight === "") {
      setErrors({ ...errors, weight: "empty" });
      return;
    }

    if (athlete.discipline === "") {
      setErrors({ ...errors, discipline: "empty" });
      return;
    }
    if (athlete.category === "") {
      setErrors({ ...errors, category: "empty" });
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
      customNavigate("back", "newAthlete", from ? "athletes" : "startTest");
      setTimeout(() => {
        navigate(from ? "/athletes" : "/startTest");
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
      if (!isNaN(parseFloat(weightNum))) {
        setAthlete({
          ...athlete,
          weight: Math.round(2.2 * parseFloat(weightNum)).toString(),
        });
      }
    }
    if (prevWeightUnit === "lbs" && athlete.weightUnit === "kgs") {
      const weightNum = athlete.weight;
      if (!isNaN(parseFloat(weightNum))) {
        setAthlete({
          ...athlete,
          weight: Math.round(0.45392 * parseFloat(weightNum)).toString(),
        });
      }
    }
  }, [athlete.weightUnit]);

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    if (athlete.country.length) {
      setStatesList(State.getStatesOfCountry(athlete.country));
      setAthlete({ ...athlete, state: "" });
    }
  }, [athlete.country]);

  useEffect(() => {
    if (genderReset) setAthlete({ ...athlete, gender: "" });
  }, [genderReset]);

  useEffect(() => {
    if (countryReset) setAthlete({ ...athlete, country: "" });
  }, [countryReset]);
  useEffect(() => {
    if (stateReset) setAthlete({ ...athlete, state: "" });
  }, [stateReset]);
  useEffect(() => {
    if (disciplineReset) setAthlete({ ...athlete, discipline: "" });
  }, [disciplineReset]);

  useEffect(() => {
    onBlurChange(showInfo);
  }, [showInfo]);

  return (
    <div
      className="flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out"
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[95%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-8 transition-all 300 ease-in-out ${animation} ${
          showInfo && "blur-md pointer-events-none"
        }`}
      >
        <div
          className="mt-4 -mr-4 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="close" />
        </div>
        <div className="w-full flex justify-center -mt-10 items-center gap-x-16">
          <div className="w-[187px]"></div>
          <p className="text-3xl text-secondary self-center">Añadir Atleta</p>
          {fastLoad ? (
            <OutlinedButton
              title="Desactivar Carga Rápida"
              icon="close"
              onClick={() => setFastLoad(false)}
            />
          ) : (
            <>
              <TonalButton
                title="Carga Rápida"
                icon="lightning"
                onClick={() => setFastLoad(true)}
              />
              <p
                className="text-secondary hover:opacity-70 active:opacity-40 cursor-pointer"
                onClick={() => setShowInfo(true)}
              >
                ¿Qué es la carga rápida?
              </p>
            </>
          )}
        </div>
        <p className="text-4xl mt-8 text-tertiary flex items-center">
          Datos del Atleta{" "}
          {fastLoad ? (
            <span className="text-secondary text-2xl text-light ml-4 ">
              {currentAthleteIndex + 1}/{athletesToSave.length + 1}
            </span>
          ) : (
            ""
          )}{" "}
        </p>
        <div className={`flex w-full mt-8 ${fieldsAnimation}`}>
          {/* Left Column */}
          <div className="flex flex-col w-1/2">
            {/* Name */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("name").charAt(0).toUpperCase() + t("name").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
                  inputStyles.input
                } ${errors.name && inputStyles.focused} ${
                  lockedFields.includes("name") && "border border-lightRed"
                }`}
                placeholder={
                  t("name").charAt(0).toUpperCase() + t("name").slice(1) + "..."
                }
                value={athlete.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {fastLoad && (
                <img
                  src={`/${!lockedFields.includes("name") ? "un" : ""}lock.png`}
                  alt=""
                  className="ml-4 cursor-pointer w-7 h-7 "
                  onClick={() =>
                    lockedFields.includes("name")
                      ? setLockedFields(
                          lockedFields.filter((e) => e !== "name")
                        )
                      : setLockedFields([...lockedFields, "name"])
                  }
                />
              )}
            </div>
            {errors.name === "duplicate" && (
              <p className="text-secondary -mt-1 self-center">
                El atleta ya existe
              </p>
            )}
            {errors.name === "numbers" && (
              <p className="text-secondary -mt-1 self-center">
                Los nombres no pueden contener números
              </p>
            )}
            {/* Birth Date */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("birthDate").charAt(0).toUpperCase() +
                  t("birthDate").slice(1)}
              </p>
              <div
                className={`bg-offWhite y rounded-2xl flex items-center justify-between w-48 shadow-sm pl-2 pr-1 h-10 text-tertiary border border-transparent  ${
                  inputStyles.input
                } ${errors.birthDate && inputStyles.focused} ${
                  lockedFields.includes("birthDate") && "border border-lightRed"
                }`}
              >
                <input
                  type="date"
                  ref={inputRef}
                  className={`w-3/5 h-full bg-inherit focus:outline-none  text-tertiary [&::-webkit-calendar-picker-indicator]:hidden $`}
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
              {fastLoad && (
                <img
                  src={`/${
                    !lockedFields.includes("birthDate") ? "un" : ""
                  }lock.png`}
                  alt=""
                  className="ml-4 cursor-pointer w-7 h-7 "
                  onClick={() =>
                    lockedFields.includes("birthDate")
                      ? setLockedFields(
                          lockedFields.filter((e) => e !== "birthDate")
                        )
                      : setLockedFields([...lockedFields, "birthDate"])
                  }
                />
              )}
            </div>
            {/* Country */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("country").charAt(0).toUpperCase() + t("country").slice(1)}
              </p>
              <AutocompleteDropdown
                data={countries}
                onSelect={(e: string) => {
                  setAthlete({ ...athlete, country: e });
                }}
                placeholder="Selecciona un país"
                valueKey="isoCode"
                displayKey="name"
                reset={countryReset}
                error={errors.country}
                setError={(e: string) => setErrors({ ...errors, country: e })}
                setReset={setCountryReset}
                fastload={fastLoad}
                lockedFields={lockedFields}
                setLockedFields={setLockedFields}
                field="country"
              />
            </div>
            {/* State */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">{t("state")}</p>
              <AutocompleteDropdown
                placeholder={
                  statesList.length === 0
                    ? "No aplica"
                    : "Selecciona una provincia/estado"
                }
                data={statesList}
                onSelect={(e) => {
                  setAthlete({ ...athlete, state: e });
                }}
                valueKey="isoCode"
                displayKey="name"
                disabled={statesList.length === 0}
                reset={stateReset}
                setReset={setStateReset}
                error={errors.state}
                setError={(e: string) => setErrors({ ...errors, state: e })}
                fastload={fastLoad}
                lockedFields={lockedFields}
                setLockedFields={setLockedFields}
                field="state"
              />
            </div>

            {/* Gender */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("gender").charAt(0).toUpperCase() + t("gender").slice(1)}
              </p>
              <AutocompleteDropdown
                placeholder="Selecciona un género"
                data={genders}
                onSelect={(e: "M" | "F" | "O") => {
                  setAthlete({ ...athlete, gender: e });
                }}
                valueKey="isoCode"
                displayKey="name"
                reset={genderReset}
                setReset={setGenderReset}
                error={errors.gender}
                setError={(e: string) => setErrors({ ...errors, gender: e })}
                fastload={fastLoad}
                lockedFields={lockedFields}
                setLockedFields={setLockedFields}
                field="gender"
              />
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
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-tertiary mr-4 ${
                    inputStyles.input
                  } ${errors.height && inputStyles.focused} ${
                    lockedFields.includes("height") && "border border-lightRed"
                  }`}
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
              {fastLoad && (
                <img
                  src={`/${
                    !lockedFields.includes("height") ? "un" : ""
                  }lock.png`}
                  alt=""
                  className="ml-4 cursor-pointer w-7 h-7"
                  onClick={() =>
                    lockedFields.includes("height")
                      ? setLockedFields(
                          lockedFields.filter((e) => e !== "height")
                        )
                      : setLockedFields([...lockedFields, "height"])
                  }
                />
              )}
            </div>
            {/* Weight with Units */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("weight").charAt(0).toUpperCase() + t("weight").slice(1)}
              </p>
              <div className="flex items-center">
                <input
                  type="numeric"
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-tertiary mr-4 ${
                    inputStyles.input
                  } ${errors.weight && inputStyles.focused} ${
                    lockedFields.includes("weight") && "border border-lightRed"
                  }`}
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
              {fastLoad && (
                <img
                  src={`/${
                    !lockedFields.includes("weight") ? "un" : ""
                  }lock.png`}
                  alt=""
                  className="ml-4 cursor-pointer w-7 h-7"
                  onClick={() =>
                    lockedFields.includes("weight")
                      ? setLockedFields(
                          lockedFields.filter((e) => e !== "weight")
                        )
                      : setLockedFields([...lockedFields, "weight"])
                  }
                />
              )}
            </div>

            {/* Discipline */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("discipline").charAt(0).toUpperCase() +
                  t("discipline").slice(1)}
              </p>
              <AutocompleteDropdown
                placeholder="Selecciona una disciplina"
                data={formattedDisciplines}
                error={errors.discipline}
                valueKey="id"
                displayKey="label"
                onSelect={(e) => {
                  setAthlete({ ...athlete, discipline: e });
                }}
                setError={(e) => {
                  setErrors({ ...errors, discipline: e });
                }}
                reset={disciplineReset}
                setReset={setDisciplineReset}
                fastload={fastLoad}
                lockedFields={lockedFields}
                setLockedFields={setLockedFields}
                field="discipline"
              />
            </div>

            {/* Category */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("category").charAt(0).toUpperCase() + t("category").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
                  inputStyles.input
                } ${errors.category && inputStyles.focused} ${
                  lockedFields.includes("category") && "border border-lightRed"
                }`}
                placeholder={
                  t("category").charAt(0).toUpperCase() +
                  t("category").slice(1) +
                  "..."
                }
                value={athlete.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              />
              {fastLoad && (
                <img
                  src={`/${
                    !lockedFields.includes("category") ? "un" : ""
                  }lock.png`}
                  alt=""
                  className="ml-4 cursor-pointer w-7 h-7"
                  onClick={() =>
                    lockedFields.includes("category")
                      ? setLockedFields(
                          lockedFields.filter((e) => e !== "category")
                        )
                      : setLockedFields([...lockedFields, "category"])
                  }
                />
              )}
            </div>

            {/* Institution */}
            <div className="flex items-center my-4">
              <p className="w-40 text-right mr-8 text-darkGray">
                {t("institution").charAt(0).toUpperCase() +
                  t("institution").slice(1)}
              </p>
              <input
                type="text"
                className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
                  inputStyles.input
                } ${errors.institution && inputStyles.focused} ${
                  lockedFields.includes("institution") &&
                  "border border-lightRed"
                }`}
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
              {fastLoad && (
                <img
                  src={`/${
                    !lockedFields.includes("institution") ? "un" : ""
                  }lock.png`}
                  alt=""
                  className="ml-4 cursor-pointer w-7 h-7"
                  onClick={() =>
                    lockedFields.includes("institution")
                      ? setLockedFields(
                          lockedFields.filter((e) => e !== "institution")
                        )
                      : setLockedFields([...lockedFields, "institution"])
                  }
                />
              )}
            </div>
          </div>
        </div>{" "}
        <div className={`w-full items-center flex flex-col ${fieldsAnimation}`}>
          <p className="w-40 text-right self-start mr-8 text-darkGray mt-4">
            Comentarios
          </p>
          <textarea
            name=""
            id=""
            className={`bg-offWhite border border-gray shadow-sm rounded-2xl h-20 p-2 text-tertiary mt-2 w-3/4 self-center ${inputStyles.input}`}
          ></textarea>
        </div>
        {fastLoad ? (
          <div className="w-full items-center justify-center gap-x-16 flex my-12">
            <OutlinedButton
              title="Borrar Atleta"
              icon="delete"
              onClick={deleteAthlete}
              containerStyles="mr-16"
            />
            <OutlinedButton
              title="Volver"
              icon="back"
              inverse
              onClick={onBack}
            />
            <TonalButton title="Siguiente" icon="next" onClick={onNext} />
            <TonalButton
              title="Guardar y Continuar"
              icon="save"
              containerStyles="ml-16"
              onClick={() => {}}
            />
          </div>
        ) : (
          <TonalButton
            containerStyles="self-center my-12"
            title="Guardar Atleta"
            icon="next"
            onClick={saveAthlete}
          />
        )}
      </div>
      {showInfo && (
        <div
          className="bg-white shadow-lg fixed z-50 rounded-2xl py-2 px-8 w-[600px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center border border-gray"
        >
          <div
            className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={() => setShowInfo(false)}
          >
            <img src="/close.png" className="h-6 w-6" alt="Close" />
          </div>
          <img src="/lock.png" alt="" className="w-12 h-12 self-center mt-8 " />
          <ul className="text-tertiary text-lg my-8 list-disc">
            <li>
              La{" "}
              <span className="text-secondary font-medium">carga rápida</span>{" "}
              permite fijar valores de campos para poder cargar atletas
              rápidamente.
            </li>
            <li>
              Por ejemplo, si desea cargar atletas de una misma institucion y/o
              de un mismo género, puede fijar ambos campos, agilizando la carga.
            </li>
            <li>
              Haga click en el{" "}
              <span className="text-secondary font-medium">candado</span> al
              lado de un campo para fijar su valor.
            </li>
          </ul>
          <TonalButton
            icon="backWhite"
            onClick={() => {
              setShowInfo(false);
            }}
            title="Volver"
            inverse
            containerStyles="mt-8 mb-4"
          />
        </div>
      )}
    </div>
  );
}

export default NewAthlete;
