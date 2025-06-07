import { useEffect, useRef, useState, useCallback } from "react";

const TrainProjection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [black, setBlack] = useState(true);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePlay = useCallback(
    (vidPath: string, from: number, to: number, speed: number) => {
      if (!videoRef.current) return;
      clearTimer();
      setBlack(false);

      const v = videoRef.current;
      v.src = vidPath;
      v.playbackRate = speed;
      v.currentTime = from;
      void v.play();

      const realDurationMs = ((to - from) / speed) * 1000;

      timeoutRef.current = setTimeout(() => {
        (window as any).playerAPI.notifyFinished();
        setBlack(true);
      }, realDurationMs);
    },
    []
  );

  const handlePause = useCallback(() => {
  }, []);

  const handleResume = useCallback(() => {
  }, []);

  const handleDelay = useCallback((seconds: number) => {
    clearTimer();
    setBlack(true);
    timeoutRef.current = setTimeout(() => setBlack(false), seconds * 1000);
  }, []);

  useEffect(() => {
    const { playerAPI } = window as any;

    playerAPI.onPlay(handlePlay);
    playerAPI.onPause(handlePause);
    playerAPI.onResume(handleResume);
    playerAPI.onDelay(handleDelay);
    playerAPI.notifyLoaded();

    return () => {
      playerAPI.offPlay?.(handlePlay);
      playerAPI.offPause?.(handlePause);
      playerAPI.offResume?.(handleResume);
      playerAPI.offDelay?.(handleDelay);
      clearTimer();
    };
  }, [handlePlay, handlePause, handleResume, handleDelay]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <video
        ref={videoRef}
        controls={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          visibility: black ? "hidden" : "visible"
        }}
      />
      {black && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "black"
          }}
        />
      )}
    </div>
  );
};

export default TrainProjection;

