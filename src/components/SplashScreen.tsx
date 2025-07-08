import Lottie from "lottie-react";
import React from "react";
import animationData from "../assets/data_logo.json";

function SplashScreen() {
  return (
    <div className="w-[100vw] h-[100vh] bg-secondary flex items-center justify-center z-50 overflow-hidden">
      <div className="h-[800px] w-[800px] flex items-center justify-center overflow-hidden relative">
        <style>
          {`
            .lottie-container svg image {
              display: none !important;
            }
            .lottie-container {
              position: absolute;
              top: 30%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 100%;
              height: 100%;
            }
            .lottie-container svg {
              width: 100%;
              height: 100%;
            }
          `}
        </style>
        <div className="lottie-container">
          <Lottie animationData={animationData} />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
