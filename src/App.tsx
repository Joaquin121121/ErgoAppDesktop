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
import { Window } from "@tauri-apps/api/window";

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
  const options = ["studies", "athletes" /* "about" */];
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
    setTimeout(() => {}, 600);
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
  } as const;

  const expandScreen = async () => {
    const result = await appWindow.maximize();
    console.log(result);
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

  return (
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
  );
}

export default App;
