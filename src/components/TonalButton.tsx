interface ButtonProps {
  title: string;
  isLoading?: boolean;
  onClick: () => void;
  containerStyles?: string;
  textStyles?: string;
  icon?: React.ReactNode;
  inverse?: boolean;
  disabled?: boolean;
}

const TonalButton = ({
  title,
  isLoading = false,
  onClick,
  containerStyles = "",
  textStyles = "",
  icon,
  inverse = false,
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        flex items-center justify-center px-4 py-2 rounded-lg
        bg-secondary text-white
        transition-all duration-200
        hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${containerStyles}
      `}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && !inverse && <span className="mr-2">{icon}</span>}
          <span className={`font-medium ${textStyles}`}>{title}</span>
          {icon && inverse && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default TonalButton;
