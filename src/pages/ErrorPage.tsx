import React, { useState, useEffect } from "react";
import TonalButton from "../components/TonalButton";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AutoplayVideo from "../components/AutoplayVideo";
import navAnimations from "../styles/animations.module.css";
import useBackspaceNavigation from "../hooks/useBackspaceNavigation";

interface ErrorPageProps {
  animation?: string;
  onReset?: () => void;
  errorMessage?: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  onReset,
  errorMessage,
  customNavigate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [animation, setAnimation] = useState(navAnimations.fadeInRight);
  const [showFirstVideo, setShowFirstVideo] = useState(true);

  const handleReturn = () => {
    if (onReset) {
      try {
        onReset();
      } catch (e) {
        console.error("Error in onReset:", e);
      }
    }

    // Force the app to replace the current URL instead of pushing to history
    navigate("/", { replace: true });
  };

  useEffect(() => {
    setTimeout(() => {
      setShowFirstVideo(false);
    }, 2000);
  }, []);

  useBackspaceNavigation(() => {
    setAnimation(navAnimations.fadeOutRight);
    setTimeout(() => {
      customNavigate("back", "error", "studies");
      handleReturn();
    }, 300);
  });

  return (
    <div
      className={`flex-1 w-[100vw] h-[100vh] relative flex flex-col items-center transition-all duration-300 ease-in-out`}
    >
      <div
        className={`w-[90%] h-[95%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col items-center transition-all 300 ease-in-out ${animation}`}
      >
        <div className="self-center w-1/2 h-[400px] relative">
          <div
            className={`absolute inset-0 ${
              showFirstVideo ? "opacity-100" : "opacity-0"
            }`}
          >
            <AutoplayVideo
              src="/error.mp4"
              width="100%"
              height="100%"
              loop={false}
            />
          </div>
          <div
            className={`absolute inset-0 ${
              showFirstVideo ? "opacity-0" : "opacity-100"
            }`}
          >
            <AutoplayVideo
              src="/rainLoop.mov"
              width="100%"
              height="100%"
              loop={true}
            />
          </div>
        </div>
        <h1 className="text-2xl text-secondary mb-6 mt-16">
          Hemos encontrado un error inesperado.
        </h1>
        <p className="text-lg  mb-12">
          Por favor, intentá nuevamente. Si el problema persiste, contactanos en{" "}
          <span className="text-secondary cursor-pointer hover:opacity-70 active:opacity-40">
            soporte@ergoapp.com.
          </span>
        </p>
        <TonalButton
          inverse
          title="Volver"
          onClick={() => {
            setAnimation(navAnimations.fadeOutRight);
            setTimeout(() => {
              customNavigate("back", "error", "studies");
              handleReturn();
            }, 300);
          }}
          icon="backWhite"
          containerStyles="self-center"
        />
      </div>
    </div>
  );
};

export default ErrorPage;
