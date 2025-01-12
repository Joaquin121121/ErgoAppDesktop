import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Studies from "./pages/Studies";
import Athletes from "./pages/Athletes";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { useNavigate } from "react-router-dom";

const Layout = ({
  children,
  isBlured = false,
}: {
  children: React.ReactNode;
  isBlured?: boolean;
}) => {
  const options = ["studies", "athletes", "about"];
  const navigate = useNavigate();

  const [selectedOption, setSelectedOption] = useState("studies");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="flex w-screen h-screen bg-offWhite">
        <nav
          className={`h-full relative pt-12 px-8 bg-white ${
            isExpanded ? "w-56" : "w-32"
          } ${
            isBlured ? "blur-md pointer-events-none" : ""
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
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </p>
              )}
            </div>
          ))}
          <img
            className="absolute h-36 w-18 left-4 bottom-16"
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
  const [isBlured, setIsBlured] = useState(false);
  return (
    <BrowserRouter>
      <Layout isBlured={isBlured}>
        <Routes>
          <Route path="/" element={<Studies onBlurChange={setIsBlured} />} />
          <Route
            path="/studies"
            element={<Studies onBlurChange={setIsBlured} />}
          />
          <Route path="/athletes" element={<Athletes />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
