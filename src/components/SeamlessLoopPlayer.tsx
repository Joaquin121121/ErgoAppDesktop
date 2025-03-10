import React, { useRef, useEffect, useState } from "react";

interface SeamlessLoopPlayerProps {
  src: string;
  width?: string | number;
  height?: string | number;
  loop?: boolean;
  overlapTime?: number; // Time in seconds to overlap videos
}

const SeamlessLoopPlayer = ({
  src,
  width = "100%",
  height = "auto",
  loop = false,
  overlapTime = 0.2, // Default overlap time in seconds
}: SeamlessLoopPlayerProps) => {
  // We'll use three video elements to ensure seamless playback
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoMeta, setVideoMeta] = useState({ duration: 0, loaded: false });
  const [activeIndex, setActiveIndex] = useState(1);

  // Set up video elements and metadata
  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    const video3 = video3Ref.current;

    if (!video1 || !video2 || !video3) return;

    // Initially mute all videos to ensure they can autoplay
    video1.muted = true;
    video2.muted = true;
    video3.muted = true;

    // Function to handle metadata loaded
    const handleMetadata = () => {
      if (video1.duration) {
        setVideoMeta({
          duration: video1.duration,
          loaded: true,
        });
      }
    };

    // Set up event listeners
    video1.addEventListener("loadedmetadata", handleMetadata);

    // Load videos
    video1.load();
    video2.load();
    video3.load();

    return () => {
      video1.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, [src]);

  // Main playback control
  useEffect(() => {
    if (!videoMeta.loaded || !loop) return;

    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    const video3 = video3Ref.current;

    if (!video1 || !video2 || !video3) return;

    // Start the first video
    video1.currentTime = 0;
    video1.play().catch((e) => console.error("Video playback failed:", e));

    // Set up the cycle
    const cycleVideos = () => {
      const activeVideo =
        activeIndex === 1 ? video1 : activeIndex === 2 ? video2 : video3;

      const nextIndex = activeIndex === 3 ? 1 : activeIndex + 1;
      const nextVideo =
        nextIndex === 1 ? video1 : nextIndex === 2 ? video2 : video3;

      // Position next video at the beginning
      nextVideo.currentTime = 0;

      // Calculate when to start the next video (before current one ends)
      const startNextAt = videoMeta.duration - overlapTime;

      // If we're close to the end, start the next video
      if (activeVideo.currentTime >= startNextAt) {
        nextVideo
          .play()
          .catch((e) => console.error("Failed to play next video:", e));

        // Update the active index
        setActiveIndex(nextIndex);

        // Reset this timeout since we've triggered the next video
        return;
      }

      // Check again soon
      setTimeout(cycleVideos, 10);
    };

    // Start checking for loop points
    const checkInterval = setTimeout(
      cycleVideos,
      Math.max(0, (videoMeta.duration - overlapTime) * 1000 - 100)
    );

    return () => {
      clearTimeout(checkInterval);
    };
  }, [videoMeta.loaded, videoMeta.duration, activeIndex, loop, overlapTime]);

  // If not looping, just show a single video
  if (!loop) {
    return (
      <video
        src={src}
        width={width}
        height={height}
        muted
        playsInline
        autoPlay
        style={{ objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
      }}
    >
      {/* Three identical videos for triple buffering */}
      <video
        ref={video1Ref}
        src={src}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: activeIndex === 1 ? 1 : 0,
        }}
      />

      <video
        ref={video2Ref}
        src={src}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: activeIndex === 2 ? 1 : 0,
        }}
      />

      <video
        ref={video3Ref}
        src={src}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: activeIndex === 3 ? 1 : 0,
        }}
      />
    </div>
  );
};

export default SeamlessLoopPlayer;
