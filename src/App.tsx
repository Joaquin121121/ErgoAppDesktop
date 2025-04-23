import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Studies from "./pages/Studies";
import Athletes from "./pages/Athletes";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { useNavigate } from "react-router-dom";
import StartTest from "./pages/StartTest";
import NewTest from "./pages/NewTest";
import styles from "./styles/animations.module.css";
import { useTranslation } from "react-i18next";
import { camelToNatural } from "./utils/utils";
import NewAthlete from "./pages/NewAthlete";
import SelectAthlete from "./pages/SelectAthlete";
import AthleteStudies from "./pages/AthleteStudies";
import OutlinedButton from "./components/OutlinedButton";
import UpdateChecker from "./components/UpdateChecker";
import ConnectionStatus from "./components/ConnectionStatus";
import { Window } from "@tauri-apps/api/window";
import { User } from "./types/User";
import { UserProvider } from "./contexts/UserContext";
import StudyInfo from "./pages/StudyInfo";
import CompletedStudyInfo from "./pages/CompletedStudyInfo";
import CompareTwoStudies from "./pages/CompareTwoStudies";
import CompareThreeStudies from "./pages/CompareThreeStudies";
import CompareTwoAthletes from "./pages/CompareTwoAthletes";
import { AthleteComparisonProvider } from "./contexts/AthleteComparisonContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./pages/ErrorPage";
import CompletedStudyDashboard from "./pages/CompletedStudyDashboard";
import Dashboard from "./pages/Dashboard";
import { BlurProvider, useBlur } from "./contexts/BlurContext";
import { CalendarProvider } from "./contexts/CalendarContext";
import { NewEventProvider } from "./contexts/NewEventContext";
import { supabase } from "./supabase";
import Library from "./pages/Library";
import AthleteMenu from "./pages/AthleteMenu";
import TrainingMenu from "./pages/TrainingMenu";
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

        <img
          className={`absolute h-36 w-18 bottom-8 transition-all duration-300 ease-in-out`}
          style={{
            left: isExpanded ? "58px" : "16px",
          }}
          src="/lucy.png"
          alt="test"
        />
      </nav>
      <main className="flex-1 h-full">{children}</main>
    </div>
  );
};

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [selectedOption, setSelectedOption] = useState("studies");
  const [isBlockingClicks, setIsBlockingClicks] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [hasGlobalError, setHasGlobalError] = useState(false);
  const appWindow = Window.getCurrent();
  const keys = [
    "dashboard",
    "studies",
    "athletes",
    "library",
    "about",
    "notFound",
    "startTest",
    "newTest",
    "selectAthlete",
    "newAthlete",
    "athleteStudies",
    "studyInfo",
    "completedStudyInfo",
    "compareTwoStudies",
    "compareThreeStudies",
    "compareTwoAthletes",
    "error",
    "completedStudyDashboard",
    "athleteMenu",
    "trainingMenu",
  ] as const;
  const [animations, setAnimations] = useState(
    Object.fromEntries(keys.map((key) => [key, ""]))
  );
  type Page = (typeof keys)[number];

  const resetAnimations = () => {
    setAnimations(Object.fromEntries(keys.map((key) => [key, ""])));
  };

  const handleError = () => {
    setHasGlobalError(true);
  };
  const handleErrorReset = () => {
    setHasGlobalError(false);
    setSelectedOption("studies");
  };

  const customNavigate = (
    direction: "back" | "forward",
    page: Page,
    nextPage: Page
  ) => {
    setTimeout(() => {
      resetAnimations();
    }, 600);
    if (direction === "back") {
      setAnimations({
        ...animations,
        [page]: styles.fadeOutRight,
        [nextPage]: styles.fadeInLeft,
      });

      return;
    }
    setAnimations({
      ...animations,
      [page]: styles.fadeOutLeft,
      [nextPage]: styles.fadeInRight,
    });
  };

  const getPageComponent = (page: string) => {
    switch (page) {
      case "studies":
        return (
          <Studies
            isExpanded={isExpanded}
            animation={animations.studies}
            customNavigate={customNavigate}
          />
        );
      case "athletes":
        return (
          <Athletes
            isExpanded={isExpanded}
            animation={animations.athletes}
            customNavigate={customNavigate}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            isExpanded={isExpanded}
            animation={animations.dashboard}
            customNavigate={customNavigate}
          />
        );
      case "library":
        return (
          <Library
            isExpanded={isExpanded}
            animation={animations.library}
            customNavigate={customNavigate}
          />
        );
      case "about":
        return (
          <About
            isExpanded={isExpanded}
            animation={animations.about}
            customNavigate={customNavigate}
          />
        );
      case "notFound":
        return (
          <NotFound
            isExpanded={isExpanded}
            animation={animations.notFound}
            customNavigate={customNavigate}
          />
        );
      case "startTest":
        return (
          <StartTest
            isExpanded={isExpanded}
            animation={animations.startTest}
            customNavigate={customNavigate}
            setSelectedOption={setSelectedOption}
          />
        );
      case "newTest":
        return (
          <NewTest
            isExpanded={isExpanded}
            animation={animations.newTest}
            customNavigate={customNavigate}
          />
        );
      case "selectAthlete":
        return (
          <SelectAthlete
            isExpanded={isExpanded}
            animation={animations.selectAthlete}
            customNavigate={customNavigate}
          />
        );
      case "newAthlete":
        return (
          <NewAthlete
            isExpanded={isExpanded}
            animation={animations.newAthlete}
            customNavigate={customNavigate}
          />
        );
      case "athleteStudies":
        return (
          <AthleteStudies
            isExpanded={isExpanded}
            animation={animations.athleteStudies}
            customNavigate={customNavigate}
          />
        );
      case "studyInfo":
        return (
          <StudyInfo
            isExpanded={isExpanded}
            animation={animations.studyInfo}
            customNavigate={customNavigate}
          />
        );
      case "completedStudyInfo":
        return (
          <CompletedStudyInfo
            isExpanded={isExpanded}
            animation={animations.completedStudyInfo}
            customNavigate={customNavigate}
          />
        );
      case "compareTwoStudies":
        return (
          <CompareTwoStudies
            isExpanded={isExpanded}
            animation={animations.compareTwoStudies}
            customNavigate={customNavigate}
          />
        );
      case "compareThreeStudies":
        return (
          <CompareThreeStudies
            isExpanded={isExpanded}
            animation={animations.compareThreeStudies}
            customNavigate={customNavigate}
          />
        );
      case "compareTwoAthletes":
        return (
          <CompareTwoAthletes
            isExpanded={isExpanded}
            animation={animations.compareTwoAthletes}
            customNavigate={customNavigate}
          />
        );
      case "error":
        return (
          <ErrorPage
            animation={animations.error}
            onReset={handleErrorReset}
            customNavigate={customNavigate}
          />
        );
      case "completedStudyDashboard":
        return (
          <CompletedStudyDashboard
            isExpanded={isExpanded}
            animation={animations.completedStudyDashboard}
            customNavigate={customNavigate}
          />
        );
      case "athleteMenu":
        return (
          <AthleteMenu
            isExpanded={isExpanded}
            animation={animations.athleteMenu}
            customNavigate={customNavigate}
          />
        );
      case "trainingMenu":
        return (
          <TrainingMenu
            isExpanded={isExpanded}
            animation={animations.trainingMenu}
            customNavigate={customNavigate}
          />
        );
      default:
        return (
          <NotFound
            isExpanded={isExpanded}
            animation={animations.notFound}
            customNavigate={customNavigate}
          />
        );
    }
  };

  useEffect(() => {
    // Check initial maximized state
    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    // Listen for window resize events which might indicate maximization
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    // Cleanup listener on unmount
    return () => {
      unlisten.then((unsubscribe) => unsubscribe());
    };
  }, []);

  if (hasGlobalError) {
    // In case of a global error, render just the error page without layout
    return (
      <HashRouter>
        <Routes>
          <Route
            path="*"
            element={
              <ErrorPage
                onReset={handleErrorReset}
                customNavigate={customNavigate}
              />
            }
          />
        </Routes>
      </HashRouter>
    );
  }
  if (!isMaximized) {
    return (
      <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center bg-secondary overflow-hidden">
        <img className="w-1/2 h-1/2 object-contain" src="/splash.png" />
        <p className="text-2xl text-offWhite mt-8">
          Maximice la ventana para usar la app
        </p>
      </div>
    );
  }

  return (
    <AthleteComparisonProvider>
      <NewEventProvider>
        <UserProvider>
          <BlurProvider>
            <CalendarProvider>
              <HashRouter>
                <UpdateChecker
                  showUpdate={showUpdate}
                  setShowUpdate={setShowUpdate}
                />
                <ConnectionStatus showUpdate={showUpdate} />
                {isBlockingClicks && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      background: "transparent",
                      zIndex: 9999,
                    }}
                  />
                )}

                <Routes>
                  <Route
                    path="/error"
                    element={
                      <ErrorPage
                        onReset={handleErrorReset}
                        customNavigate={customNavigate}
                      />
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <WithLayout
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        resetAnimations={resetAnimations}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                      >
                        <ErrorBoundary
                          onError={handleError}
                          onReset={handleErrorReset}
                          fallback={<Navigate to="/error" replace />}
                        >
                          <Routes>
                            <Route
                              path="/"
                              element={getPageComponent("studies")}
                            />
                            <Route
                              path="/studies"
                              element={getPageComponent("studies")}
                            />
                            <Route
                              path="/athletes"
                              element={getPageComponent("athletes")}
                            />
                            <Route
                              path="/library"
                              element={getPageComponent("library")}
                            />
                            <Route
                              path="/about"
                              element={getPageComponent("about")}
                            />
                            <Route
                              path="/startTest"
                              element={getPageComponent("startTest")}
                            />
                            <Route
                              path="/newTest"
                              element={getPageComponent("newTest")}
                            />
                            <Route
                              path="/selectAthlete"
                              element={getPageComponent("selectAthlete")}
                            />
                            <Route
                              path="/newAthlete"
                              element={getPageComponent("newAthlete")}
                            />
                            <Route
                              path="/athleteMenu"
                              element={getPageComponent("athleteMenu")}
                            />
                            <Route
                              path="/athleteStudies"
                              element={getPageComponent("athleteStudies")}
                            />
                            <Route
                              path="/studyInfo"
                              element={getPageComponent("studyInfo")}
                            />
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
                              element={getPageComponent(
                                "completedStudyDashboard"
                              )}
                            />
                            <Route
                              path="/trainingMenu"
                              element={getPageComponent("trainingMenu")}
                            />
                            <Route
                              path="/dashboard"
                              element={getPageComponent("dashboard")}
                            />
                            <Route
                              path="*"
                              element={getPageComponent("notFound")}
                            />
                          </Routes>
                        </ErrorBoundary>
                      </WithLayout>
                    }
                  />
                </Routes>
              </HashRouter>
            </CalendarProvider>
          </BlurProvider>
        </UserProvider>
      </NewEventProvider>
    </AthleteComparisonProvider>
  );
}

export default App;
