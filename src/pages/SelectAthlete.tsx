import React, { useEffect, useState, useRef } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import { useNavigate } from "react-router-dom";
import inputStyles from "../styles/inputStyles.module.css";
import { Athlete, transformToAthlete } from "../types/Athletes";
import { useTranslation } from "react-i18next";
import { useJsonFiles } from "../hooks/useJsonFiles";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import { naturalToCamelCase } from "../utils/utils";

const SelectAthlete = ({ isExpanded, animation, customNavigate }) => {
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthleteName, setSelectedAthleteName] = useState("");
  const [loadedAthletes, setLoadedAthletes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [prevHeight, setPrevHeight] = useState<string>("");
  const [prevHeightUnit, setPrevHeightUnit] = useState<"cm" | "ft" | "">("");
  const [prevWeightUnit, setPrevWeightUnit] = useState<"kgs" | "lbs" | "">("");

  const [allowEdit, setAllowEdit] = useState(false);

  const [errors, setErrors] = useState({
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

  const inputRef = useRef(null);

  const { readDirectoryJsons, saveJson } = useJsonFiles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { athlete, setAthlete } = useStudyContext();

  const filteredAthletes = loadedAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAthleteSelect = (selectedAthlete) => {
    setSelectedAthleteName(selectedAthlete.name);
    setAthlete(selectedAthlete);
    setSearchTerm(selectedAthlete.name);
    setShowDropdown(false);
  };

  const onClose = () => {
    customNavigate("back", "selectAthlete", "startTest");
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
    const VALIDATION_LIMITS = {
      weight: {
        kgs: { max: 200 },
        lbs: { max: 440 },
      },
      height: {
        cm: { max: 230 },
        ft: { max: 7 },
      },
    };

    if (
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
        .map((item) => transformToAthlete(item.content))
        .filter((athlete) => athlete !== null);
      setLoadedAthletes(parsedAthletes);
    } catch (error) {
      console.log(error);
    }
  };

  const onSave = async () => {
    try {
      const result = await saveJson(
        `${naturalToCamelCase(athlete.name)}.json`,
        athlete,
        "athletes"
      );
      console.log(result);
      customNavigate("back", "selectAthlete", "startTest");
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

  return (
    <div
      className="flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out"
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 transition-all duration-300 ease-in-out ${animation}`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>

        <p className="text-3xl text-secondary self-center -mt-10">
          Buscar Atleta
        </p>

        <div className="relative w-2/5 self-center">
          <div
            className={`h-12 rounded-2xl bg-offWhite shadow-sm flex items-center mt-8 px-4 ${
              searchBarFocus && "border border-secondary"
            }`}
          >
            <img src="/search.png" alt="Buscar" className="h-8 w-8 mr-8" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              className="flex-1 h-full focus:outline-none text-lg  bg-offWhite text-black"
              onFocus={() => {
                setSearchBarFocus(true);
                setShowDropdown(true);
              }}
              onBlur={() => {
                setSearchBarFocus(false);
                // Delay hiding dropdown to allow click events
                setTimeout(() => setShowDropdown(false), 200);
              }}
              placeholder="Buscar atleta..."
            />
          </div>

          {showDropdown && searchTerm && (
            <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
              {filteredAthletes.length > 0 ? (
                filteredAthletes.map((athlete, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-lightRed hover:text-secondary cursor-pointer text-black"
                    onClick={() => handleAthleteSelect(athlete)}
                  >
                    {athlete.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-darkGray">
                  No hay ningun atleta de nombre '{searchTerm}'
                </div>
              )}
            </div>
          )}
        </div>
        {selectedAthleteName.length > 0 && (
          <div className="flex mt-8 items-center self-center">
            <p className="text-lg text-black ">
              Atleta seleccionado:{" "}
              <span className="text-secondary">{selectedAthleteName}</span>
            </p>
            {/*   <OutlinedButton
              title={allowEdit ? "Guardar" : "Editar"}
              icon={allowEdit ? "checkRed" : "pencil"}
              onClick={() => {
                setAllowEdit(!allowEdit);
              }}
              containerStyles="h-8 ml-8"
            /> */}
          </div>
        )}
        {selectedAthleteName.length > 0 && (
          <div className="flex w-full mt-2">
            {/* Left Column */}
            <div className="flex flex-col w-1/2">
              {/* Name */}
              <div className="flex items-center my-4">
                <p className="w-40 text-right mr-8 text-darkGray">
                  {t("name").charAt(0).toUpperCase() + t("name").slice(1)}
                </p>
                <input
                  type="text"
                  disabled={selectedAthleteName.length === 0}
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                    inputStyles.input
                  } ${errors.name && inputStyles.focused}`}
                  placeholder={
                    t("name").charAt(0).toUpperCase() +
                    t("name").slice(1) +
                    "..."
                  }
                  value={athlete.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

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
                  disabled={selectedAthleteName.length === 0}
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
                  disabled={selectedAthleteName.length === 0}
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
                  disabled={selectedAthleteName.length === 0}
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                    inputStyles.input
                  } ${errors.gender && inputStyles.focused}`}
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
              {/* Height */}
              <div className="flex items-center my-4">
                <p className="w-40 text-right mr-8 text-darkGray">
                  {t("height").charAt(0).toUpperCase() + t("height").slice(1)}
                </p>
                <div className="flex items-center">
                  <input
                    type="numeric"
                    disabled={selectedAthleteName.length === 0}
                    className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-black mr-4 ${
                      inputStyles.input
                    } ${errors.height && inputStyles.focused}`}
                    placeholder={
                      t("height").charAt(0).toUpperCase() +
                      t("height").slice(1) +
                      "..."
                    }
                    value={athlete.height}
                    onChange={(e) =>
                      handleInputChange("height", e.target.value)
                    }
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

              {/* Weight */}
              <div className="flex items-center my-4">
                <p className="w-40 text-right mr-8 text-darkGray">
                  {t("weight").charAt(0).toUpperCase() + t("weight").slice(1)}
                </p>
                <div className="flex items-center">
                  <input
                    type="numeric"
                    disabled={selectedAthleteName.length === 0}
                    className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-black mr-4 ${
                      inputStyles.input
                    } ${errors.weight && inputStyles.focused}`}
                    placeholder={
                      t("weight").charAt(0).toUpperCase() +
                      t("weight").slice(1) +
                      "..."
                    }
                    value={athlete.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
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
                  disabled={selectedAthleteName.length === 0}
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
                  {t("category").charAt(0).toUpperCase() +
                    t("category").slice(1)}
                </p>
                <input
                  type="text"
                  disabled={selectedAthleteName.length === 0}
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-black ${
                    inputStyles.input
                  } ${errors.category && inputStyles.focused}`}
                  placeholder={
                    t("category").charAt(0).toUpperCase() +
                    t("category").slice(1) +
                    "..."
                  }
                  value={athlete.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
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
                  disabled={selectedAthleteName.length === 0}
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
        )}

        <TonalButton
          title={selectedAthleteName.length > 0 ? "Continuar" : "Volver"}
          icon={selectedAthleteName.length > 0 ? "check" : "backWhite"}
          containerStyles="self-center my-8 "
          onClick={onSave}
          inverse={selectedAthleteName.length === 0}
        />
      </div>
    </div>
  );
};

export default SelectAthlete;
