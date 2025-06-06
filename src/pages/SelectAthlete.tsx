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
import AutocompleteDropdown from "../components/AutocompleteDropdown";
import { Country, State } from "country-state-city";
import { formattedDisciplines } from "../constants/data";
import { getStateByCodeAndCountry } from "country-state-city/lib/state";
import { useSearchParams } from "react-router-dom";
import _ from "lodash";
import getAthletes, { saveAthleteInfo } from "../hooks/parseAthletes";
import { useUser } from "../contexts/UserContext";
import AthleteFilter from "../components/AthleteFilter";

const SelectAthlete = ({ isExpanded, animation, customNavigate }) => {
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthleteName, setSelectedAthleteName] = useState("");
  const [loadedAthletes, setLoadedAthletes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [prevHeight, setPrevHeight] = useState<string>("");
  const [prevHeightUnit, setPrevHeightUnit] = useState<"cm" | "ft" | "">("");
  const [prevWeightUnit, setPrevWeightUnit] = useState<"kgs" | "lbs" | "">("");
  const [statesList, setStatesList] = useState([]);
  const [countryReset, setCountryReset] = useState(false);
  const [stateReset, setStateReset] = useState(false);
  const [genderReset, setGenderReset] = useState(false);
  const [disciplineReset, setDisciplineReset] = useState(false);
  const [multipleSelection, setMultipleSelection] = useState(false);
  const [initialState, setInitialState] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [multipleAthleteIndex, setMultipleAthleteIndex] = useState(0);
  const [showAthleteFilter, setShowAthleteFilter] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [categories, setCategories] = useState([]);
  const initialFilters = {
    age: [],
    gender: [],
    institution: [],
    discipline: [],
    category: [],
  };

  const [selectedFilters, setSelectedFilters] = useState(initialFilters);

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

  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const [showAthleteInfo, setShowAthleteInfo] = useState(!!from);

  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const { readDirectoryJsons, saveJson } = useJsonFiles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    athlete,
    setAthlete,
    resetAthlete,
    selectedAthletes,
    setSelectedAthletes,
  } = useStudyContext();
  const [originalAthlete, setOriginalAthlete] = useState(athlete);
  const { user } = useUser();

  const countries = Country.getAllCountries();

  const genders = [
    { name: "Femenino", isoCode: "F" },
    { name: "Masculino", isoCode: "M" },
    { name: "Otro", isoCode: "O" },
  ];

  const [athletesFilteredBySelection, setAthletesFilteredBySelection] =
    useState([]);
  const [athletesFilteredBySearch, setAthletesFilteredBySearch] = useState([]);

  const handleAthleteSelect = (selectedAthlete) => {
    /*     if (
      selectedAthletes.some((athlete) => athlete.name === selectedAthlete.name)
    ) {
      const index = selectedAthletes.findIndex(
        (athlete) => athlete.name === selectedAthlete.name
      );
      setSearchBarFocus(false);
      setShowDropdown(false);
      setMultipleAthleteIndex(index);
      setAthlete(selectedAthletes[index]);
      setSelectedAthleteName(selectedAthletes[index].name);
      setSearchTerm(selectedAthletes[index].name);
      return;
    } */

    setSelectedAthleteName(selectedAthlete.name);
    setAthlete(selectedAthlete);
    setOriginalAthlete(selectedAthlete);
    setSearchTerm(selectedAthlete.name);
    setShowDropdown(false);
    setInitialState(
      getStateByCodeAndCountry(selectedAthlete.state, selectedAthlete.country)
        ?.name || ""
    );
    if (multipleSelection) {
      setSelectedAthletes([...selectedAthletes, selectedAthlete]);
      setAthletesFilteredBySelection([
        ...athletesFilteredBySelection.filter(
          (a) => a.id !== selectedAthlete.id
        ),
      ]);
      setMultipleAthleteIndex(selectedAthletes.length);
      return;
    }
  };

  const showFilter = () => {
    setSearchTerm("");
    setSelectedAthleteName("");
    resetAthlete();

    setShowAthleteFilter(true);
  };

  const onClose = () => {
    if (!from) {
      resetAthlete();
    }
    setSelectedAthletes([]);
    customNavigate("back", "selectAthlete", from ? "athleteMenu" : "startTest");
    setTimeout(() => {
      navigate(from ? "/athleteMenu" : "/startTest");
    }, 300);
  };

  const handleDeleteAthlete = (athlete) => {
    if (!multipleSelection || selectedAthletes.length === 1) {
      setSelectedAthleteName("");
      resetAthlete();
      setSearchTerm("");
      setSelectedAthletes([]);
      return;
    }

    const newSelectedAthletes = selectedAthletes.filter(
      (a) => a.id !== athlete.id
    );

    if (
      multipleAthleteIndex === newSelectedAthletes.length ||
      multipleAthleteIndex ===
        selectedAthletes.findIndex((e) => e.id === athlete.id)
    ) {
      const newIndex =
        multipleAthleteIndex === newSelectedAthletes.length
          ? multipleAthleteIndex - 1
          : multipleAthleteIndex;

      setMultipleAthleteIndex(newIndex);
      const newCurrentAthlete = newSelectedAthletes[newIndex];
      setSelectedAthleteName(newCurrentAthlete?.name || "");
      setAthlete(newCurrentAthlete);
      setOriginalAthlete(newCurrentAthlete);
      setSearchTerm(newCurrentAthlete?.name || "");
    }
    setSelectedAthletes(newSelectedAthletes);
    setAthletesFilteredBySelection([...athletesFilteredBySelection, athlete]);
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

  const togglePicker = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const toggleMultipleSelection = () => {
    setMultipleSelection(!multipleSelection);
    setSelectedAthletes(selectedAthleteName.length > 0 ? [athlete] : []);
    setMultipleAthleteIndex(0);
    if (multipleSelection) {
      setAthletesFilteredBySelection(loadedAthletes);
    }
  };

  const handleAthletePointer = (e, athlete) => {
    // Handle all pointer types (mouse, touch, pen)
    e.preventDefault();
    handleAthleteSelect(athlete);
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
      const chars = value.split("");
      if (value.length === 4) {
        const secondToLast = chars[value.length - 2];
        const last = chars[value.length - 1];
        if (secondToLast !== "1" || (last !== "0" && last !== "1")) {
          return;
        }
      }
      if (value.length > 4) {
        return;
      }
    }

    if (
      (field === "weight" || field === "height") &&
      value !== "" &&
      !/^\d+$/.test(String(value)) &&
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
      const athletes = await getAthletes(user.id);
      setLoadedAthletes(athletes);
      setAthletesFilteredBySelection(athletes);
      setAthletesFilteredBySearch(athletes);
    } catch (error) {
      console.log(error);
    }
  };

  const onSave = async () => {
    console.log("athlete", athlete);
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
    console.log("multipleSelection", multipleSelection);
    if (multipleSelection) {
      setAthletesFilteredBySelection(
        athletesFilteredBySelection.filter((a) => a.id !== athlete.id)
      );

      if (multipleAthleteIndex === selectedAthletes.length - 1) {
        setSelectedAthleteName("");
        setSearchTerm("");
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
        setMultipleAthleteIndex(multipleAthleteIndex + 1);

        return;
      }
      const nextAthlete = selectedAthletes[multipleAthleteIndex + 1];
      setAthlete(nextAthlete);
      setOriginalAthlete(nextAthlete);
      setSelectedAthleteName(nextAthlete.name);
      setSearchTerm(nextAthlete.name);
      setMultipleAthleteIndex(multipleAthleteIndex + 1);
      console.log("athletesFilteredBySelection", athletesFilteredBySelection);
      return;
    }

    try {
      console.log("athlete", athlete);
      const result = await saveAthleteInfo(athlete, user.id);
      console.log("result", result);
      customNavigate("back", "selectAthlete", from ? "athletes" : "startTest");
      setTimeout(() => {
        navigate(from ? "/athletes" : "/startTest");
      }, 300);
    } catch (error) {
      console.log(error);
    }
  };

  const getButtonTitle = () => {
    if (!selectedAthleteName && !multipleSelection) return "Siguiente";
    if (multipleAthleteIndex === selectedAthletes.length - 1) {
      return "Añadir Nuevo";
    }
    if (from && isModified) return "Guardar Cambios";
    return isModified
      ? `${multipleSelection ? "Siguiente" : "Guardar y Continuar"}`
      : `${multipleSelection ? "Siguiente" : "Continuar"}`;
  };

  const validateFilter = (filter, value) => {
    if (filter.length === 0) return true;
    if (filter.includes(value)) return true;
    return false;
  };

  const applyFilters = () => {
    setMultipleSelection(true);
    if (
      Object.values(selectedFilters).every(
        (value) => Array.isArray(value) && value.length === 0
      )
    ) {
      setSelectedFilters(initialFilters);

      setAthletesFilteredBySelection(loadedAthletes);
      setSelectedAthleteName("");
      setOriginalAthlete(null);
      resetAthlete();
      setMultipleAthleteIndex(0);
      setSelectedAthletes([]);
      setShowAthleteFilter(false);
      return;
    }
    const newSelectedAthletes = loadedAthletes.filter(
      (athlete) =>
        validateFilter(selectedFilters.discipline, athlete.discipline) &&
        validateFilter(selectedFilters.institution, athlete.institution) &&
        validateFilter(selectedFilters.category, athlete.category) &&
        validateFilter(selectedFilters.gender, athlete.gender) &&
        validateFilter(selectedFilters.age, athlete.age)
    );
    if (newSelectedAthletes.length === 0) {
      setSelectedAthleteName("");
      setSearchTerm("");
      setSelectedAthletes([]);
      setMultipleAthleteIndex(0);
      setShowAthleteFilter(false);
      console.log("newSelectedAthletes", newSelectedAthletes);
      return;
    }

    setMultipleAthleteIndex(0);
    setSelectedAthletes(newSelectedAthletes);
    setAthletesFilteredBySelection(
      loadedAthletes.filter(
        (athlete) => !newSelectedAthletes.some((a) => a.id === athlete.id)
      )
    );
    setSelectedAthleteName(newSelectedAthletes[0].name);

    setOriginalAthlete(newSelectedAthletes[0]);
    setAthlete(newSelectedAthletes[0]);

    setShowAthleteFilter(false);
  };

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const athleteItemsRef = useRef([]);

  const handleKeyDown = (e) => {
    if (!showDropdown || !athletesFilteredBySearch.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < athletesFilteredBySearch.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleAthleteSelect(athletesFilteredBySearch[selectedIndex]);
        }
        break;

      default:
        break;
    }
  };

  // Ensure selected item is visible in the dropdown
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const selectedElement = dropdown.children[selectedIndex];

      if (selectedElement) {
        const dropdownRect = dropdown.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        if (selectedRect.bottom > dropdownRect.bottom) {
          selectedElement.scrollIntoView(false);
        } else if (selectedRect.top < dropdownRect.top) {
          selectedElement.scrollIntoView(true);
        }
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    console.log("athletesFilteredBySelection", athletesFilteredBySelection);
  }, [athletesFilteredBySelection]);
  // Reset selected index when search term changes or dropdown visibility changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm, showDropdown]);

  useEffect(() => {
    setAthletesFilteredBySearch(
      searchTerm.trim() === ""
        ? athletesFilteredBySelection
        : athletesFilteredBySelection.filter((athlete) =>
            athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
    );
  }, [searchTerm, athletesFilteredBySelection]);

  useEffect(() => {
    setInstitutions(
      Array.from(new Set(loadedAthletes.map((athlete) => athlete.institution)))
    );
  }, [loadedAthletes]);

  useEffect(() => {
    const categories = new Set();
    for (const athlete of loadedAthletes) {
      if (selectedFilters.discipline.includes(athlete.discipline)) {
        categories.add(athlete.category);
      }
    }
    setCategories(Array.from(categories));
  }, [selectedFilters.discipline]);

  useEffect(() => {
    setSelectedAthletes([]);
    setMultipleAthleteIndex(0);
  }, []);

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
    setStatesList(State.getStatesOfCountry(athlete.country));
    // Only reset state if the country has actually changed from the original athlete's country
    // not when switching between different athletes
    if (originalAthlete && athlete.country !== originalAthlete.country) {
      setStateReset(true);
      setAthlete({ ...athlete, state: "" });
    }
  }, [athlete.country, originalAthlete]);

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
    if (from) {
      handleAthleteSelect(athlete);
    } else {
      loadAthletes();
    }
  }, []);

  useEffect(() => {
    if (!_.isEqual(originalAthlete, athlete)) {
      setIsModified(true);
    } else {
      setIsModified(false);
    }
  }, [athlete]);

  // Add useEffect to scroll selected athlete into view
  useEffect(() => {
    if (
      multipleSelection &&
      selectedAthletes.length > 0 &&
      athleteItemsRef.current[multipleAthleteIndex]
    ) {
      athleteItemsRef.current[multipleAthleteIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [multipleAthleteIndex, selectedAthletes.length, multipleSelection]);

  return (
    <div
      className="flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out"
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      {showAthleteFilter && (
        <AthleteFilter
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onClose={() => setShowAthleteFilter(false)}
          resetFilters={() => setSelectedFilters(initialFilters)}
          institutions={institutions}
          categories={categories}
          selectGroup
          onApply={applyFilters}
        />
      )}
      <div
        className={`w-[95%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-8 transition-all duration-300 ease-in-out ${animation}`}
      >
        <div
          className="mt-4 -mr-4 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>

        <p className="text-3xl text-secondary self-center -mt-10">
          {from ? "Datos del" : "Buscar"} Atleta
          {multipleSelection && "s"}{" "}
          {multipleSelection &&
            `(${
              selectedAthleteName.length > 0
                ? multipleAthleteIndex + 1
                : multipleAthleteIndex
            }/${selectedAthletes.length})`}
        </p>

        {!from && (
          <div className="w-full flex mt-8 items-center justify-center gap-x-16">
            <OutlinedButton
              title="Seleccionar Grupo"
              icon="group"
              onClick={showFilter}
            />
            <div className="relative w-2/5 self-center">
              <div
                className={`h-12 rounded-2xl bg-offWhite shadow-sm flex items-center  px-4 ${
                  searchBarFocus && "border border-secondary"
                }`}
              >
                <img src="/search.png" alt="Buscar" className="h-8 w-8 mr-8" />
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (!showDropdown || !athletesFilteredBySearch.length)
                      return;

                    switch (e.key) {
                      case "ArrowDown":
                        e.preventDefault();
                        setSelectedIndex((prev) =>
                          prev < athletesFilteredBySearch.length - 1
                            ? prev + 1
                            : prev
                        );
                        break;
                      case "Escape":
                        e.preventDefault();
                        setShowDropdown(false);
                        break;

                      case "ArrowUp":
                        e.preventDefault();
                        setSelectedIndex((prev) =>
                          prev > 0 ? prev - 1 : prev
                        );
                        break;

                      case "Enter":
                        e.preventDefault();
                        if (selectedIndex >= 0) {
                          handleAthleteSelect(
                            athletesFilteredBySearch[selectedIndex]
                          );
                        }
                        break;

                      default:
                        break;
                    }
                  }}
                  className="flex-1 h-full focus:outline-none text-lg bg-offWhite text-tertiary"
                  onFocus={() => {
                    setSearchBarFocus(true);
                    setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setSearchBarFocus(false);
                    // Only hide dropdown if we're not using keyboard navigation
                    if (selectedIndex === -1) {
                      setTimeout(() => setShowDropdown(false), 200);
                    }
                  }}
                  placeholder={`Buscar atleta${
                    multipleSelection ? "s" : ""
                  }...`}
                />
              </div>

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
                  role="listbox"
                  tabIndex={-1}
                  onKeyDown={handleKeyDown}
                >
                  {athletesFilteredBySearch.length > 0 ? (
                    athletesFilteredBySearch.map((athlete, index) => (
                      <div
                        key={index}
                        role="option"
                        aria-selected={selectedIndex === index}
                        className={`px-4 py-2 cursor-pointer ${
                          selectedIndex === index
                            ? "bg-lightRed text-secondary"
                            : "text-tertiary hover:bg-lightRed hover:text-secondary"
                        }`}
                        onClick={(e) => handleAthletePointer(e, athlete)}
                        style={{ touchAction: "none" }} // Prevent default touch actions
                      >
                        {athlete.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-darkGray">
                      {searchTerm
                        ? `No hay ningun atleta de nombre '${searchTerm}'`
                        : "No hay atletas disponibles"}
                    </div>
                  )}
                </div>
              )}
            </div>
            {multipleSelection ? (
              <OutlinedButton
                title="Desactivar Selección Múltiple"
                onClick={() => {
                  toggleMultipleSelection();
                }}
                icon="close"
              />
            ) : (
              <TonalButton
                title="Selección Múltiple"
                onClick={() => {
                  toggleMultipleSelection();
                }}
                icon="people"
              />
            )}
          </div>
        )}

        {selectedAthleteName.length > 0 && !from && (
          <div className="flex mt-8 items-center self-center">
            <p className="text-lg text-tertiary ">
              Atleta seleccionado:{" "}
              <span className="text-secondary">{selectedAthleteName} </span>
            </p>
            <img
              src="/close.png"
              className="h-6 w-6 ml-4 cursor-pointer hover:opacity-70 active:opacity-40"
              onClick={() => {
                handleDeleteAthlete(athlete);
              }}
            />
          </div>
        )}
        {selectedAthleteName.length > 0 && showAthleteInfo && (
          <div className="flex w-full mt-2">
            {/* Left Column */}
            <div className="flex flex-col w-1/2">
              {/* Name */}
              <div className="flex items-center my-4">
                <p className="w-40 text-right mr-8 text-darkGray">
                  Nombre Completo
                </p>
                <input
                  type="text"
                  disabled={selectedAthleteName.length === 0}
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
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
                  className={`bg-offWhite y rounded-2xl flex items-center justify-between w-48 shadow-sm pl-2 pr-1 h-10 text-tertiary ${
                    inputStyles.input
                  } ${errors.birthDate && inputStyles.focused}`}
                >
                  <input
                    type="date"
                    ref={inputRef}
                    className={`w-3/5 h-full bg-inherit focus:outline-none  text-tertiary [&::-webkit-calendar-picker-indicator]:hidden`}
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
                <AutocompleteDropdown
                  initialQuery={Country.getCountryByCode(athlete.country)?.name}
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
                  field="country"
                />
              </div>

              {/* State */}
              <div className="flex items-center my-4">
                <p className="w-40 text-right mr-8 text-darkGray">
                  {t("state").charAt(0).toUpperCase() + t("state").slice(1)}
                </p>
                <AutocompleteDropdown
                  initialQuery={initialState}
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
                  field="state"
                />
              </div>
              {/* Gender */}
              <div className="flex items-center my-4">
                <p className="w-40 text-right mr-8 text-darkGray">
                  {t("gender").charAt(0).toUpperCase() + t("gender").slice(1)}
                </p>
                <AutocompleteDropdown
                  initialQuery={t(athlete.gender)}
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
                  field="gender"
                />
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
                    className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-tertiary mr-4 ${
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
                    className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-28 h-10 text-tertiary mr-4 ${
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
                <AutocompleteDropdown
                  initialQuery={athlete.discipline}
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
                  field="discipline"
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
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
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
                  className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
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
        {(!from || (from && isModified)) && (
          <div className="w-full justify-center gap-x-16 items-center flex my-8">
            {multipleSelection && selectedAthleteName.length > 0 && (
              <>
                <TonalButton
                  disabled={multipleAthleteIndex === 0}
                  title="Anterior"
                  icon="backWhite"
                  inverse
                  onClick={() => {
                    if (multipleAthleteIndex === 0) {
                      return;
                    }
                    const prevAthlete =
                      selectedAthletes[multipleAthleteIndex - 1];
                    setAthlete(prevAthlete);
                    setOriginalAthlete(prevAthlete);

                    setSelectedAthleteName(prevAthlete.name);
                    setSearchTerm(prevAthlete.name);
                    setMultipleAthleteIndex(
                      (multipleAthleteIndex) => multipleAthleteIndex - 1
                    );
                  }}
                />
              </>
            )}
            {selectedAthleteName && (
              <div className="self-center flex items-center justify-center gap-x-16">
                <OutlinedButton
                  title={
                    showAthleteInfo
                      ? "Ocultar Info" +
                        (!multipleSelection ? " del Atleta" : "")
                      : "Ver Info" + (!multipleSelection ? " del Atleta" : "")
                  }
                  onClick={() => {
                    setShowAthleteInfo(!showAthleteInfo);
                  }}
                  icon={showAthleteInfo ? "close" : "info"}
                />

                <TonalButton
                  title={getButtonTitle()}
                  icon={multipleSelection ? "next" : "check"}
                  containerStyles="self-center"
                  onClick={selectedAthleteName ? onSave : onClose}
                  inverse={!selectedAthleteName}
                  disabled={multipleAthleteIndex === loadedAthletes.length - 1}
                />
              </div>
            )}
          </div>
        )}

        {from && (
          <OutlinedButton
            title="Ver Tests"
            onClick={() => {
              customNavigate("back", "selectAthlete", "athleteStudies");
              setTimeout(() => {
                navigate("/athleteStudies?from=athlete");
              }, 300);
            }}
            icon="test"
            containerStyles="self-center mt-4 mb-8 "
          />
        )}
      </div>
      {multipleSelection &&
        selectedAthletes.length >= 1 &&
        !showAthleteInfo && (
          <div
            className={`bg-white  flex flex-col mt-12 self-end shadow-sm rounded-2xl mr-8 px-8 py-4 ${animation}`}
          >
            <p className="text-2xl  text-secondary mb-2">
              Atletas Seleccionados
            </p>
            <div
              className="flex flex-col overflow-y-scroll px-4"
              style={{ maxHeight: "250px" }}
            >
              {selectedAthletes.map((athlete, index) => (
                <div
                  key={athlete.id}
                  ref={(el) => (athleteItemsRef.current[index] = el)}
                  className="flex gap-x-2 items-center mt-2 "
                >
                  <p
                    className={`hover:cursor-pointer hover:opacity-70 active:opacity-40 hover:text-secondary transition-all duration-200 w-60 truncate ${
                      index === multipleAthleteIndex && "text-secondary"
                    }`}
                    onClick={() => {
                      setAthlete(athlete);
                      setOriginalAthlete(athlete);
                      setSelectedAthleteName(athlete.name);
                      setSearchTerm(athlete.name);
                      setMultipleAthleteIndex(index);
                    }}
                  >
                    - {athlete.name}
                  </p>
                  <img
                    src="close.png"
                    alt=""
                    className="h-5 w-5 hover:opacity-70 hover:cursor-pointer active:opacity-40"
                    onClick={() => handleDeleteAthlete(athlete)}
                  />
                </div>
              ))}
            </div>
            <TonalButton
              title="Guardar y Continuar"
              icon="save"
              onClick={() => {
                customNavigate("forward", "selectAthlete", "startTest");
                resetAthlete();
                setTimeout(() => {
                  navigate("/startTest");
                }, 300);
              }}
              containerStyles="mt-8 mb-4"
            />
          </div>
        )}
    </div>
  );
};

export default SelectAthlete;
