import React, { useState, useRef, useEffect } from "react";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";

interface AccordionItemProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  showPapers?: () => void;
  managePlan?: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  showPapers,
  managePlan,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

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

  return (
    <div className="mb-3">
      {/* Accordion Header */}
      <div
        onClick={onToggle}
        className={`w-full h-16 flex justify-between items-center px-4 cursor-pointer rounded-2xl transition-all duration-300 ease-linear ${
          isExpanded
            ? "border border-[#e81d23] text-[#e81d23]"
            : "border border-transparent hover:bg-offWhite"
        }`}
      >
        <p
          className={`text-xl ${
            isExpanded ? "text-[#e81d23]" : "text-secondary"
          }`}
        >
          {title}
        </p>
        <img
          src="/arrowDown.png"
          alt=""
          className={`h-10 w-10 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Accordion Content with animation */}
      <div
        ref={contentRef}
        style={{
          height: height !== undefined ? `${height}px` : "auto",
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
        }}
        className="border-l-2 border-r-2 border-b-2 border-transparent rounded-b-2xl"
      >
        <div className="px-8 py-4 min-w-[300px] w-full whitespace-normal">
          {children}
          {(showPapers || managePlan) && (
            <div
              className={`flex ${
                showPapers && managePlan ? "justify-around" : "justify-center"
              } w-full mt-6`}
            >
              {showPapers && (
                <OutlinedButton
                  title="Ver Papers"
                  icon="test"
                  onClick={showPapers}
                  containerStyles="self-center"
                />
              )}
              {managePlan && (
                <TonalButton
                  title="Gestionar Plan"
                  icon="plan"
                  onClick={managePlan}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CustomAccordionProps {
  items: {
    title: string;
    content: React.ReactNode;
  }[];
  initialExpandedIndex?: number;
  showPapers?: () => void;
  managePlan?: () => void;
  collapseAccordion?: boolean;
  onCollapseComplete?: () => void;
}

const CustomAccordion: React.FC<CustomAccordionProps> = ({
  items,
  initialExpandedIndex = 0,
  showPapers,
  managePlan,
  collapseAccordion = false,
  onCollapseComplete,
}) => {
  const [expandedIndex, setExpandedIndex] =
    useState<number>(initialExpandedIndex);

  useEffect(() => {
    if (collapseAccordion) {
      setExpandedIndex(-1);
      // Notify parent that collapsing is complete
      if (onCollapseComplete) {
        onCollapseComplete();
      }
    }
  }, [collapseAccordion, onCollapseComplete]);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isExpanded={expandedIndex === index}
          onToggle={() => handleToggle(index)}
          showPapers={showPapers}
          managePlan={managePlan}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default CustomAccordion;
