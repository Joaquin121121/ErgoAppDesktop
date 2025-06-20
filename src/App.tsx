import { useState } from "react";
import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import Studies from "./pages/Studies";
import Athletes from "./pages/Athletes";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { StudyProvider } from "./contexts/StudyContext";
import { useNavigate } from "react-router-dom";
import StartTest from "./pages/StartTest";
import NewTest from "./pages/NewTest";
import { useTranslation } from "react-i18next";
import { camelToNatural } from "./utils/utils";
import NewAthlete from "./pages/NewAthlete";
import SelectAthlete from "./pages/SelectAthlete";
import AthleteStudies from "./pages/AthleteStudies";
import OutlinedButton from "./components/OutlinedButton";
import { UserProvider, useUser } from "./contexts/UserContext";
import StudyInfo from "./pages/StudyInfo";
import CompletedStudyInfo from "./pages/CompletedStudyInfo";
import CompareTwoStudies from "./pages/CompareTwoStudies";
import CompareThreeStudies from "./pages/CompareThreeStudies";
import CompareTwoAthletes from "./pages/CompareTwoAthletes";
import { AthleteComparisonProvider } from "./contexts/AthleteComparisonContext";
import CompletedStudyDashboard from "./pages/CompletedStudyDashboard";
import Dashboard from "./pages/Dashboard";
import { BlurProvider, useBlur } from "./contexts/BlurContext";
import { CalendarProvider } from "./contexts/CalendarContext";
import { NewEventProvider } from "./contexts/NewEventContext";
import Library from "./pages/Library";
import AthleteMenu from "./pages/AthleteMenu";
import TrainingMenu from "./pages/TrainingMenu";
import { NewPlanProvider } from "./contexts/NewPlanContext";
import AuthGate, { Page } from "./components/AuthGate";
import { AthletesProvider } from "./contexts/AthletesContext";
// Import useDatabaseSync for type checking only
import { useDatabaseSync } from "./hooks/useDatabaseSync";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalSize } from "@tauri-apps/api/window";
import ContentLibrary from "./pages/ContentLibrary";
import TrainingModelLibrary from "./pages/TrainingModelLibrary";
import TrainingModel from "./pages/TrainingModel";
import { TrainingModelsProvider } from "./contexts/TrainingModelsContext";
// Create a wrapper that controls showing the Layout
const WithLayout = ({
  children,
  isExpanded,
  setIsExpanded,
  resetAnimations,
  selectedOption,
  setSelectedOption,
}) => {
  const options = ["dashboard", "studies", "athletes", "library", "about"];
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isBlurred, setIsBlurred } = useBlur();
  const { user, logout } = useUser();

  const window = getCurrentWindow();
  const handleLogout = async () => {
    resetAnimations();
    await window.setSize(new PhysicalSize(800, 600));
    logout();
  };

  return (
    <div className="flex w-screen h-screen bg-offWhite">
      <nav
        className={`h-full fixed z-10 pt-12 px-8 bg-white ${
          isExpanded ? "w-56" : "w-32"
        } ${
          isBlurred ? "blur-md pointer-events-none" : ""
        } flex flex-col shadow-sm transition-all duration-300 ease-in-out`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <img
          src="/logo.png"
          className={`h-16 w-16 flex-shrink-0 mb-16 self-center`}
        />
        {options.map((option) => (
          <div
            key={option}
            className={`h-16 rounded-2xl cursor-pointer flex items-center mt-8 ${
              option === selectedOption && "bg-secondary text-white"
            } hover:bg-lightRed hover:text-secondary transition-colors duration-800 ease-in-out`}
            onClick={() => {
              resetAnimations();
              setSelectedOption(option);
              navigate("/" + option);
            }}
          >
            <img
              src={`/${option}${selectedOption !== option ? "Red" : ""}.png`}
              alt={option}
              className={`h-8 w-8 flex-shrink-0 ml-[16px] `}
            />
            {isExpanded && (
              <p
                className={`ml-4 text-lg text-secondary font-semibold whitespace-nowrap transition-opacity duration-800 ease-in-out ${
                  option === selectedOption && "text-white"
                }`}
              >
                {camelToNatural(t(option))}
              </p>
            )}
          </div>
        ))}
        <div
          className={`h-16 absolute bottom-16  rounded-2xl cursor-pointer flex items-center mt-8  hover:bg-lightRed hover:text-secondary transition-colors duration-800 ease-in-out w-40`}
          onClick={handleLogout}
        >
          <img
            src={`/logout.png`}
            alt="logout"
            className={`h-8 w-8 flex-shrink-0 ml-4 `}
          />
          {isExpanded && (
            <p
              className={`ml-4 text-lg text-secondary font-semibold whitespace-nowrap transition-opacity duration-800 ease-in-out`}
            >
              Salir
            </p>
          )}
        </div>
      </nav>
      <main className="flex-1 h-full">{children}</main>
    </div>
  );
};

// Create a wrapper component to handle route rendering
const RouteContentWrapper = (props: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState("studies");

  const getPageComponent = (page: string, routeProps: any = {}) => {
    // Extract animation props from props if available
    const {
      animations = {},
      customNavigate,
      resetAnimations,
      ...otherProps
    } = props;
    const animation = animations[page] || "";

    switch (page) {
      case "studies":
        return (
          <Studies
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "athletes":
        return (
          <Athletes
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "library":
        return (
          <Library
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "about":
        return (
          <About
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "notFound":
        return (
          <NotFound
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "startTest":
        return (
          <StartTest
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            setSelectedOption={setSelectedOption}
            {...otherProps}
          />
        );
      case "newTest":
        return (
          <NewTest
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "selectAthlete":
        return (
          <SelectAthlete
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "newAthlete":
        return (
          <NewAthlete
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "athleteStudies":
        return (
          <AthleteStudies
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "studyInfo":
        return (
          <StudyInfo
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "completedStudyInfo":
        return (
          <CompletedStudyInfo
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "compareTwoStudies":
        return (
          <CompareTwoStudies
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "compareThreeStudies":
        return (
          <CompareThreeStudies
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "compareTwoAthletes":
        return (
          <CompareTwoAthletes
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "completedStudyDashboard":
        return (
          <CompletedStudyDashboard
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "athleteMenu":
        return (
          <AthleteMenu
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "trainingMenu":
        return (
          <TrainingMenu
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "contentLibrary":
        return (
          <ContentLibrary
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "trainingModelLibrary":
        return (
          <TrainingModelLibrary
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      case "trainingModel":
        return (
          <TrainingModel
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
      default:
        return (
          <NotFound
            isExpanded={isExpanded}
            animation={animation}
            customNavigate={customNavigate}
            {...otherProps}
          />
        );
    }
  };

  return (
    <Routes>
      <Route path="/" element={getPageComponent("studies")} />
      <Route path="/studies" element={getPageComponent("studies")} />
      <Route path="/athletes" element={getPageComponent("athletes")} />
      <Route path="/library" element={getPageComponent("library")} />
      <Route path="/about" element={getPageComponent("about")} />
      <Route path="/startTest" element={getPageComponent("startTest")} />
      <Route path="/newTest" element={getPageComponent("newTest")} />
      <Route
        path="/selectAthlete"
        element={getPageComponent("selectAthlete")}
      />
      <Route path="/newAthlete" element={getPageComponent("newAthlete")} />
      <Route path="/athleteMenu" element={getPageComponent("athleteMenu")} />
      <Route
        path="/athleteStudies"
        element={getPageComponent("athleteStudies")}
      />
      <Route path="/studyInfo" element={getPageComponent("studyInfo")} />
      <Route
        path="/completedStudyInfo"
        element={getPageComponent("completedStudyInfo")}
      />
      <Route
        path="/compareTwoStudies"
        element={getPageComponent("compareTwoStudies")}
      />
      <Route
        path="/compareThreeStudies"
        element={getPageComponent("compareThreeStudies")}
      />
      <Route
        path="/compareTwoAthletes"
        element={getPageComponent("compareTwoAthletes")}
      />
      <Route
        path="/completedStudyDashboard"
        element={getPageComponent("completedStudyDashboard")}
      />
      <Route path="/trainingMenu" element={getPageComponent("trainingMenu")} />
      <Route path="/dashboard" element={getPageComponent("dashboard")} />
      <Route
        path="/contentLibrary"
        element={getPageComponent("contentLibrary")}
      />
      <Route
        path="/trainingModelLibrary"
        element={getPageComponent("trainingModelLibrary")}
      />
      <Route
        path="/trainingModel"
        element={getPageComponent("trainingModel")}
      />

      <Route path="*" element={getPageComponent("notFound")} />
    </Routes>
  );
};

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState("studies");

  return (
    <UserProvider>
      <AthletesProvider>
        <StudyProvider>
          <TrainingModelsProvider>
            <AthleteComparisonProvider>
              <NewEventProvider>
                <NewPlanProvider>
                  <BlurProvider>
                    <CalendarProvider>
                      <HashRouter>
                        <AuthGate
                          WithLayout={WithLayout}
                          layoutProps={{
                            isExpanded,
                            setIsExpanded,
                            selectedOption,
                            setSelectedOption,
                          }}
                        >
                          <RouteContentWrapper />
                        </AuthGate>
                      </HashRouter>
                    </CalendarProvider>
                  </BlurProvider>
                </NewPlanProvider>
              </NewEventProvider>
            </AthleteComparisonProvider>
          </TrainingModelsProvider>
        </StudyProvider>
      </AthletesProvider>
    </UserProvider>
  );
}

export default App;
