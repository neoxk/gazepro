import { useEffect, useRef } from "react"
import trainChannel from "../../../preload/trainChannel"

const TrainProjection = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    (window as any).playerAPI.onPlay(handlePlay);
    (window as any).playerAPI.onPause(() => {});
    (window as any).playerAPI.onResume(() => {});
    (window as any).playerAPI.onDelay((seconds: number) => {})
  }, [])

  const handlePlay = (vid_path: string, from: number, to: number, speed: number) => {
    videoRef.current!.src = vid_path
    videoRef.current!.playbackRate = speed
    videoRef.current!.currentTime = from
    videoRef.current!.play()
  }

  const handlePause = () => {
    videoRef.current!.pause()
  }


  const handleResume = () => {
    videoRef.current!.play()
  }

  return <div style={{width: "100vw", height:"100vh"}}>
    <video ref={videoRef} controls={false} style={{width: '100%', height: "100%", objectFit: 'contain'}}>

    </video>
  </div>
        
  }

export default TrainProjection