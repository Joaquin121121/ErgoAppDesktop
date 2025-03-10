import React, { useRef, useEffect } from "react";

interface AutoplayVideoProps {
  src: string;
  width?: string | number;
  height?: string | number;
  loop?: boolean;
}

const AutoplayVideo = ({
  src,
  width = "100%",
  height = "auto",
  loop = false,
}: AutoplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays automatically when loaded
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        // Handle autoplay issues (many browsers require user interaction)
        console.error("Autoplay failed:", error);
      });
    }
  }, []);

  return (
    <video
      ref={videoRef}
      width={width}
      height={height}
      autoPlay
      muted
      playsInline
      loop={loop}
      preload="auto" // Important for seamless looping
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default AutoplayVideo;
