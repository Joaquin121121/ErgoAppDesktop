import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
import Studies from "./pages/Studies";
import Athletes from "./pages/Athletes";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { useNavigate } from "react-router-dom";
import StartTest from "./pages/StartTest";
import HandleTest from "./pages/HandleTest";
import NewTest from "./pages/NewTest";
import styles from "./animations.module.css";
import { useTranslation } from "react-i18next";
import { camelToNatural } from "./utils";

const Layout = ({
  children,
  isBlurred = false,
  isExpanded,
  setIsExpanded,
}: {
  children: React.ReactNode;
  isBlurred?: boolean;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}) => {
  const options = ["studies", "athletes", "about"];
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedOption, setSelectedOption] = useState("studies");

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
          <img src="/logo.png" className={`h-16 w-16 flex-shrink-0 mb-16 `} />
          {options.map((option, index) => (
            <div
              key={option}
              className={`h-16 rounded-2xl cursor-pointer flex items-center mt-8 ${
                option === selectedOption && "bg-secondary text-white"
              } hover:bg-lightRed hover:text-secondary transition-colors duration-800 ease-in-out`}
              onClick={() => {
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
            className="absolute h-36 w-18 left-4 bottom-8"
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

  const keys = [
    "studies",
    "athletes",
    "about",
    "notFound",
    "startTest",
    "handleTest",
    "newTest",
  ] as const;
  const [animations, setAnimations] = useState(
    Object.fromEntries(keys.map((key) => [key, ""]))
  );
  type Page = (typeof keys)[number];

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
    setTimeout(() => {
      setAnimations(Object.fromEntries(keys.map((key) => [key, ""])));
    }, 600);
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
    handleTest: (
      <HandleTest
        isExpanded={isExpanded}
        animation={animations.handleTest}
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
  } as const;

  return (
    <HashRouter>
      <Layout
        isBlurred={isBlurred}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      >
        <Routes>
          <Route path="/" element={pages.studies} />
          <Route path="/studies" element={pages.studies} />
          <Route path="/athletes" element={pages.athletes} />
          <Route path="/about" element={pages.about} />
          <Route path="/startTest" element={pages.startTest} />
          <Route path="/handleTest" element={pages.handleTest} />
          <Route path="/newTest" element={pages.newTest} />
          <Route path="*" element={pages.notFound} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
