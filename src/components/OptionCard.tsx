import React from "react";
import TonalButton from "./TonalButton";
import { useNavigate } from "react-router-dom";

// Define the interface for the props
interface OptionCardProps {
  value: string;
  title: string;
  subtitle: string;
  param?: string; // Optional param with default handled in the component
  className?: string;
  callToAction?: string;
  onClick?: () => void;
}

// Update the component to accept props
function OptionCard({
  value,
  title,
  subtitle,
  param = "",
  className = "",
  callToAction = "",
  onClick = () => {},
}: OptionCardProps) {
  return (
    <div
      className={`flex flex-col w-1/2 items-center bg-white rounded-2xl shadow-sm ${className}`}
    >
      <p className="text-2xl ">{title}</p>
      <p className="text-darkGray">{subtitle}</p>
      {/* You can use value, target, and param here as needed */}
      {callToAction && (
        <TonalButton
          title={callToAction}
          icon="arrowRight"
          containerStyles="self-center"
          onClick={onClick}
        />
      )}
    </div>
  );
}

export default OptionCard;
