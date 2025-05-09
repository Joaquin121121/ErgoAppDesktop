import React, { useState, useRef, useEffect } from "react";

interface ProgressionWeek {
  week: number;
  series: number | string;
  repetitions: number | string;
  effort: number | string;
}

interface ExerciseAccordionItemProps {
  name: string;
  seriesN: string | number;
  reps: string;
  effort: string | number;
  restTime: string | number;
  id: string;
  currentWeek: number;
  onDelete: (id: string) => void;
  progression?: ProgressionWeek[];
}

const ExerciseAccordionItem: React.FC<ExerciseAccordionItemProps> = ({
  name,
  seriesN,
  reps,
  effort,
  restTime,
  id,
  currentWeek,
  onDelete,
  progression = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  // Generate example progression data if none is provided
  const progressionData =
    progression.length > 0
      ? progression
      : Array.from({ length: 4 }, (_, i) => ({
          week: i + 1,
          series:
            typeof seriesN === "number"
              ? seriesN
              : parseInt(seriesN as string) || 3,
          repetitions: reps.split("-")[i] || reps.split("-")[0],
          effort:
            typeof effort === "number"
              ? effort
              : parseInt(effort as string) || 8,
        }));

  useEffect(() => {
    if (isExpanded) {
      const updateHeight = () => {
        const contentHeight = contentRef.current?.scrollHeight;
        setHeight(contentHeight);
      };

      // Update height initially
      updateHeight();

      // Set up a ResizeObserver to detect content size changes
      const resizeObserver = new ResizeObserver(() => {
        if (isExpanded) {
          updateHeight();
        }
      });

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => {
        if (contentRef.current) {
          resizeObserver.unobserve(contentRef.current);
        }
        resizeObserver.disconnect();
      };
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Header - Always visible */}
      <div className="w-[90%] mx-auto grid grid-cols-8 gap-x-4 mt-4 border border-lightRed rounded-2xl">
        <p className="col-span-2 text-xl text-center my-auto py-2">{name}</p>
        <p className="text-xl text-center my-auto py-2">{seriesN}</p>
        <p className="text-xl text-center my-auto py-2">
          {reps.split("-")[currentWeek]}
        </p>
        <p className="text-xl text-center my-auto py-2">{effort}</p>
        <p className="text-xl text-center my-auto py-2">{restTime}</p>
        <div
          className="flex flex-grow justify-center items-center"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <img
            src="/close.png"
            alt=""
            className="h-7 w-7 my-2 hover:opacity-70 hover:cursor-pointer active:opacity-40 transition-all duration-200 cursor-pointer"
          />
        </div>
        <div
          className="flex justify-center items-center"
          onClick={handleToggle}
        >
          <img
            src="/arrowDown.png"
            alt=""
            className={`h-12 w-12 my-2 hover:opacity-70 hover:cursor-pointer active:opacity-40 transition-all duration-200 cursor-pointer ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expandable content */}
      <div
        ref={contentRef}
        style={{
          height: height !== undefined ? `${height}px` : "auto",
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
          width: "90%",
          margin: "0 auto",
        }}
      >
        <div className="px-8 py-4 border-l border-r border-b border-lightRed rounded-b-2xl">
          {/* Progress data in grid format */}
          <div className="grid grid-cols-8 gap-x-8 gap-y-4">
            {progressionData.map((week, index) => (
              <React.Fragment key={index}>
                <p className="text-darkGray text-center col-span-2 my-auto text-lg">
                  Semana {week.week}
                </p>
                <p className="text-lg text-center rounded-2xl  my-auto">
                  {week.series}
                </p>
                <p className="text-lg text-center rounded-2xl   my-auto ">
                  {week.repetitions}
                </p>
                <p className="text-lg text-center rounded-2xl   my-auto">
                  {week.effort}
                </p>
                <p className="text-lg text-center rounded-2xl   my-auto">
                  {restTime}
                </p>
                <div></div>
                <div></div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExerciseAccordionItem;
