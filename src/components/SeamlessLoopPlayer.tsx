import React, { useRef, useEffect, useState } from "react";

interface SeamlessLoopPlayerProps {
  src: string;
  width?: string | number;
  height?: string | number;
  loop?: boolean;
  overlapTime?: number; // Time in seconds to overlap videos
  timeBetweenReplays?: number; // Optional delay in seconds between loops
}

const SeamlessLoopPlayer = ({
  src,
  width = "100%",
  height = "auto",
  loop = false,
  overlapTime = 0.2, // Default overlap time in seconds
  timeBetweenReplays = 0, // Default delay between replays
}: SeamlessLoopPlayerProps) => {
  // We'll use three video elements to ensure seamless playback
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoMeta, setVideoMeta] = useState({ duration: 0, loaded: false });
  const [activeIndex, setActiveIndex] = useState(1);
  const scheduleTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the scheduling timeout

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

  // Effect to handle the initial play when metadata is loaded
  useEffect(() => {
    const video1 = video1Ref.current;
    if (videoMeta.loaded && loop && video1) {
      // Ensure first video starts correctly
      if (activeIndex === 1 && video1.paused) {
        video1.currentTime = 0;
        video1
          .play()
          .catch((e) => console.error("Initial video playback failed:", e));
      }
    }
    // Only run when loaded status changes, or loop prop changes
  }, [videoMeta.loaded, loop, activeIndex]);

  // Main playback control using scheduling
  useEffect(() => {
    // Clear any existing timeout when dependencies change or component unmounts
    if (scheduleTimeoutRef.current) {
      clearTimeout(scheduleTimeoutRef.current);
      scheduleTimeoutRef.current = null;
    }

    if (!videoMeta.loaded || !loop || videoMeta.duration <= 0) return;

    const videos = [video1Ref.current, video2Ref.current, video3Ref.current];
    const activeVideo = videos[activeIndex - 1];

    if (!activeVideo) return;

    const nextIndex = activeIndex === 3 ? 1 : activeIndex + 1;
    const nextVideo = videos[nextIndex - 1];

    if (!nextVideo) return;

    // Calculate the time relative to the active video's start
    // when the *next* video should begin playing.
    let nextVideoStartTime: number;
    if (timeBetweenReplays > 0) {
      // Start after the current video ends + delay
      nextVideoStartTime = videoMeta.duration + timeBetweenReplays;
    } else {
      // Start before the current video ends (overlap)
      nextVideoStartTime = videoMeta.duration - overlapTime;
    }

    // Calculate delay in milliseconds from *now* until the next video should start
    const delayMs = (nextVideoStartTime - activeVideo.currentTime) * 1000;

    // Schedule the transition
    scheduleTimeoutRef.current = setTimeout(() => {
      if (nextVideo) {
        // Prepare the next video
        nextVideo.currentTime = 0;
        nextVideo
          .play()
          .catch((e) => console.error("Failed to play next video:", e));
        setActiveIndex(nextIndex);
      }
    }, Math.max(0, delayMs)); // Ensure delay is not negative

    // Cleanup function to clear timeout
    return () => {
      if (scheduleTimeoutRef.current) {
        clearTimeout(scheduleTimeoutRef.current);
      }
    };
  }, [
    videoMeta.loaded,
    videoMeta.duration,
    activeIndex,
    loop,
    overlapTime,
    timeBetweenReplays, // Add new prop to dependencies
  ]);

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
