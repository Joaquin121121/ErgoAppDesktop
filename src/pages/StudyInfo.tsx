import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { studiesInfo } from "../constants/data";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import availableStudies from "../types/Studies";
import { useStudyContext } from "../contexts/StudyContext";
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
  const { setStudy } = useStudyContext();

  const [searchParams] = useSearchParams();
  const studyName = searchParams.get("study");
  const studyInfo = studiesInfo[studyName];

  const onClose = () => {
    customNavigate("back", "studyInfo", "about");
    setTimeout(() => {
      navigate("/about");
    }, 300);
  };

  const startStudy = () => {
    setStudy(availableStudies[studyName]);
    customNavigate("forward", "studyInfo", "startTest");
    setTimeout(() => {
      navigate("/startTest");
    }, 300);
  };

  return (
    <div
      className={`flex-1  relative flex flex-col items-center transition-all duration-300 ease-in-out `}
      style={{ paddingLeft: "128px" }}
    >
      <div
        className={`w-[60%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col px-16 ${
          isBlurred && "blur-md pointer-events-none"
        } transition-all 300 ease-in-out ${animation}`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>
        <p className="text-3xl -mt-8 text-secondary self-center ">
          {t(studyName)}
        </p>
        <p className="text-xl text-tertiary self-center mt-4">
          {studyInfo.shortDesc}
        </p>
        <p className="ml-8 mt-12 text-xl text-secondary font-medium">Qué es?</p>
        <p className="ml-8 w-3/5 mt-2 text-tertiary">{studyInfo.longDesc}</p>
        <p className="ml-8 mt-8 text-xl text-secondary font-medium">
          Que dispositivos se utilizan?
        </p>
        <p className="ml-8 w-3/5 mt-2 text-tertiary">
          Se puede medir utilizando una {studyInfo.equipment[0]}
        </p>
        <p className="ml-8 mt-8 text-xl text-secondary font-medium">
          Qué busca medir?
        </p>
        <ul className="list-disc ml-12 w-3/5 mt-2">
          {studyInfo.measures.map((measure) => (
            <li className="text-tertiary">{measure}</li>
          ))}
        </ul>
        <p className="ml-8 mt-8 text-xl text-secondary font-medium">
          Como se aplican los resultados?
        </p>
        <p className="ml-8 w-3/5 mt-2 text-tertiary">
          {studyInfo.trainingApplications}
        </p>
        <div className="flex w-full justify-around items-center mt-16 mb-8">
          <OutlinedButton title="Ver Papers" icon="test" onClick={() => {}} />
          <TonalButton
            title="Realizar Estudio"
            icon="next"
            onClick={startStudy}
          />
        </div>
      </div>
    </div>
  );
}

export default StudyInfo;
