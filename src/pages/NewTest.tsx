import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function NewTest({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const navigate = useNavigate();
  const [isBlurred, setIsBlurred] = useState(false);

  const onClose = () => {
    customNavigate("back", "startTest", "studies");
    setTimeout(() => {
      navigate("/");
    }, 200);
  };

  {
    return (
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out `}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div
          className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 ${
            isBlurred && "blur-md"
          } transition-all 300 ease-in-out ${animation}`}
        >
          <div
            className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed flex justify-center cursor-pointer"
            onClick={onClose}
          >
            <img src="/close.png" className="h-10 w-10" alt="" />
          </div>
        </div>
      </div>
    );
  }
}

export default NewTest;
