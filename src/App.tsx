import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
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
import { Window } from "@tauri-apps/api/window";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { User } from "./types/User";
import { UserProvider } from "./contexts/UserContext";
import StudyInfo from "./pages/StudyInfo";
import CompletedStudyInfo from "./pages/CompletedStudyInfo";
import CompareTwoStudies from "./pages/CompareTwoStudies";
import CompareThreeStudies from "./pages/CompareThreeStudies";
import CompareTwoAthletes from "./pages/CompareTwoAthletes";
import { AthleteComparisonProvider } from "./contexts/AthleteComparisonContext";

const Layout = ({
  children,
  isBlurred = false,
  isExpanded,
  setIsExpanded,
  resetAnimations,
  selectedOption,
  setSelectedOption,
}: {
  children: React.ReactNode;
  isBlurred?: boolean;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  resetAnimations: () => void;
  selectedOption: string;
  setSelectedOption: (selectedOption: string) => void;
}) => {
  const options = ["studies", "athletes", "about"];
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
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
          {options.map((option, index) => (
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
    </>
  );
};

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [selectedOption, setSelectedOption] = useState("studies");
  const [user, setUser] = useState<User>({ email: "" });
  const [isBlockingClicks, setIsBlockingClicks] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const appWindow = Window.getCurrent();

  const keys = [
    "studies",
    "athletes",
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
  ] as const;
  const [animations, setAnimations] = useState(
    Object.fromEntries(keys.map((key) => [key, ""]))
  );
  type Page = (typeof keys)[number];

  const resetAnimations = () => {
    setAnimations(Object.fromEntries(keys.map((key) => [key, ""])));
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

  const pages = {
    studies: (
      <Studies
        onBlurChange={setIsBlurred}
        isExpanded={isExpanded}
        animation={animations.studies}
        customNavigate={customNavigate}
      />
    ),
    athletes: (
      <Athletes
        isExpanded={isExpanded}
        animation={animations.athletes}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
    about: (
      <About
        onBlurChange={setIsBlurred}
        isExpanded={isExpanded}
        animation={animations.about}
        customNavigate={customNavigate}
      />
    ),
    notFound: (
      <NotFound
        isExpanded={isExpanded}
        animation={animations.notFound}
        customNavigate={customNavigate}
      />
    ),
    startTest: (
      <StartTest
        isExpanded={isExpanded}
        onBlurChange={setIsBlurred}
        animation={animations.startTest}
        customNavigate={customNavigate}
        setSelectedOption={setSelectedOption}
      />
    ),
    newTest: (
      <NewTest
        isExpanded={isExpanded}
        animation={animations.newTest}
        customNavigate={customNavigate}
      />
    ),

    selectAthlete: (
      <SelectAthlete
        isExpanded={isExpanded}
        animation={animations.selectAthlete}
        customNavigate={customNavigate}
      />
    ),
    newAthlete: (
      <NewAthlete
        isExpanded={isExpanded}
        animation={animations.newAthlete}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
    athleteStudies: (
      <AthleteStudies
        isExpanded={isExpanded}
        animation={animations.athleteStudies}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
    studyInfo: (
      <StudyInfo
        isExpanded={isExpanded}
        animation={animations.studyInfo}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
    completedStudyInfo: (
      <CompletedStudyInfo
        isExpanded={isExpanded}
        onBlurChange={setIsBlurred}
        animation={animations.completedStudyInfo}
        customNavigate={customNavigate}
      />
    ),
    compareTwoStudies: (
      <CompareTwoStudies
        isExpanded={isExpanded}
        animation={animations.compareTwoStudies}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
    compareThreeStudies: (
      <CompareThreeStudies
        isExpanded={isExpanded}
        animation={animations.compareThreeStudies}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
    compareTwoAthletes: (
      <CompareTwoAthletes
        isExpanded={isExpanded}
        animation={animations.compareTwoAthletes}
        customNavigate={customNavigate}
        onBlurChange={setIsBlurred}
      />
    ),
  } as const;

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

  return (
    <AthleteComparisonProvider>
      <UserProvider>
        <HashRouter>
          {isMaximized ? (
            <Layout
              isBlurred={isBlurred}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              resetAnimations={resetAnimations}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
            >
              <UpdateChecker
                showUpdate={showUpdate}
                setShowUpdate={setShowUpdate}
              />
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
                <Route path="/" element={pages.studies} />
                <Route path="/studies" element={pages.studies} />
                <Route path="/athletes" element={pages.athletes} />
                <Route path="/about" element={pages.about} />
                <Route path="/startTest" element={pages.startTest} />
                <Route path="/newTest" element={pages.newTest} />
                <Route path="/selectAthlete" element={pages.selectAthlete} />
                <Route path="/newAthlete" element={pages.newAthlete} />
                <Route path="/athleteStudies" element={pages.athleteStudies} />
                <Route path="/studyInfo" element={pages.studyInfo} />
                <Route
                  path="/completedStudyInfo"
                  element={pages.completedStudyInfo}
                />
                <Route
                  path="/compareTwoStudies"
                  element={pages.compareTwoStudies}
                />
                <Route
                  path="/compareThreeStudies"
                  element={pages.compareThreeStudies}
                />
                <Route
                  path="/compareTwoAthletes"
                  element={pages.compareTwoAthletes}
                />
                <Route path="*" element={pages.notFound} />
              </Routes>
            </Layout>
          ) : (
            <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center bg-secondary overflow-hidden">
              <img className="w-1/2 h-1/2 object-contain" src="/splash.png" />
              {/* <OutlinedButton
              title="Maximizar Ventana"
              onClick={expandScreen}
              icon="expand"
            /> */}
              <p className="text-2xl text-offWhite mt-8">
                Maximice la ventana para usar la app
              </p>
            </div>
          )}
        </HashRouter>
      </UserProvider>
    </AthleteComparisonProvider>
  );
}

export default App;
