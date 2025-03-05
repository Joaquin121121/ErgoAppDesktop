import React, { useRef, useEffect } from "react";

const AutoplayVideo = ({ src, width = "100%", height = "auto" }) => {
  const videoRef = useRef(null);

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
      muted // Muted videos are more likely to autoplay without user interaction
      playsInline // Better for mobile devices
      controls={false} // No controls
      onEnded={() => {
        // When video ends, it will stay on the last frame
        if (videoRef.current) {
          videoRef.current.currentTime = videoRef.current.duration;
        }
      }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default AutoplayVideo;

// Usage example:
// <AutoplayVideo src="/path/to/your/video.mp4" width="640px" height="360px" />
