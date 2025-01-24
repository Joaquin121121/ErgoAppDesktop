// OutlinedButton.tsx or OutlinedButton.jsx
import React, { useEffect } from "react";

interface ButtonProps {
  title: string;
  isLoading?: boolean;
  onClick: () => void;
  containerStyles?: string;
  textStyles?: string;
  icon?: string;
  inverse?: boolean;
  disabled?: boolean;
  large?: boolean;
}

// Using React.forwardRef to forward the ref to the underlying button element
const OutlinedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      title,
      isLoading = false,
      onClick,
      containerStyles = "",
      textStyles = "",
      icon,
      inverse = false,
      disabled = false,
      large,
    },
    ref
  ) => {
    return (
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        ref={ref} // Forwarded ref
        className={`
          flex items-center justify-center ${
            large && "flex-col gap-y-4 h-[130px]"
          } px-4 py-2 rounded-2xl
          bg-lightRed shadow-sm
          transition-all duration-200
          hover:bg-lightRed/10 focus:outline-none focus:ring-2 focus:ring-lightRed
          disabled:opacity-50 disabled:cursor-not-allowed
          ${containerStyles}
        `}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && inverse && (
              <img
                className={`${large ? "h-12 w-12" : "mr-4  -8 w-8"}`}
                src={`/${icon}.png`}
                alt={`${icon} icon`}
              />
            )}
            <span
              className={`text-secondary font-medium ${
                large && "text-xl"
              } ${textStyles}`}
            >
              {title}
            </span>
            {icon && !inverse && (
              <img
                className="ml-4 h-6 w-6"
                src={`/${icon}.png`}
                alt={`${icon} icon`}
              />
            )}
          </>
        )}
      </button>
    );
  }
);

// Optional: Set a display name for easier debugging
OutlinedButton.displayName = "OutlinedButton";

export default OutlinedButton;
