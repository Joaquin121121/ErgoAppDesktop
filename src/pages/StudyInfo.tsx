import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

function StudyInfo({
  onBlurChange,
  isExpanded,
  animation,
  customNavigate,
}: {
  onBlurChange: (isBlurred: boolean) => void;
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const [isBlurred, setIsBlurred] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const studyName = searchParams.get("study");

  const onClose = () => {
    customNavigate("back", "studyInfo", "about");
    setTimeout(() => {
      navigate("/about");
    }, 300);
  };

  useEffect(() => {
    console.log("wehere");
  }, []);

  return (
    <div
      className={`flex-1  relative flex flex-col items-center transition-all duration-300 ease-in-out `}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 ${
          isBlurred && "blur-md pointer-events-none"
        } transition-all 300 ease-in-out ${animation}`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>

        <p className="text-5xl text-secondary self-center -mt-10">
          {t(studyName)}
        </p>
      </div>
    </div>
  );
}

export default StudyInfo;
