import { useEffect, useRef, useState, useCallback } from 'react'

const TrainProjection = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const listenerRef = useRef<() => void>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [black, setBlack] = useState(true)

  const clearDelay = () => {
    if (delayRef.current) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
  }

  const stopAndNotify = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    if (listenerRef.current) v.removeEventListener('timeupdate', listenerRef.current)
    listenerRef.current = null
    setBlack(true)
    ;(window as any).playerAPI.notifyFinished()
  }

  const handlePlay = useCallback((vidPath: string, from: number, to: number, speed: number) => {
    const v = videoRef.current
    if (!v) return
    clearDelay()
    if (listenerRef.current) {
      v.removeEventListener('timeupdate', listenerRef.current)
      listenerRef.current = null
    }
    setBlack(false)

    const start = () => {
      v.playbackRate = speed
      v.currentTime = from
      v.play().catch(() => {})
      listenerRef.current = () => {
        if (v.currentTime >= to || v.ended) stopAndNotify()
      }
      v.addEventListener('timeupdate', listenerRef.current)
    }

    if (v.src !== vidPath) {
      v.src = vidPath
      v.load()
    }

    if (v.readyState >= v.HAVE_METADATA) start()
    else v.onloadedmetadata = start
  }, [])

  const handlePause = useCallback(() => {
    videoRef.current?.pause()
  }, [])

  const handleResume = useCallback(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  const handleDelay = useCallback((seconds: number) => {
    const v = videoRef.current
    if (v) {
      v.pause()
      if (listenerRef.current) {
        v.removeEventListener('timeupdate', listenerRef.current)
        listenerRef.current = null
      }
    }
    clearDelay()
    setBlack(true)
    delayRef.current = setTimeout(() => {
      ;(window as any).playerAPI.notifyFinished()
    }, seconds * 1000)
  }, [])

  useEffect(() => {
    const { playerAPI } = window as any
    playerAPI.onPlay(handlePlay)
    playerAPI.onPause(handlePause)
    playerAPI.onResume(handleResume)
    playerAPI.onDelay(handleDelay)

    playerAPI.isFullscreen()
    .then(isFs => {
      if (isFs) videoRef.current?.requestFullscreen().catch(() => {}) 
    }) 

    playerAPI.notifyLoaded()

    return () => {
      playerAPI.offPlay?.(handlePlay)
      playerAPI.offPause?.(handlePause)
      playerAPI.offResume?.(handleResume)
      playerAPI.offDelay?.(handleDelay)
      clearDelay()
      if (listenerRef.current && videoRef.current)
        videoRef.current.removeEventListener('timeupdate', listenerRef.current)
    }
  }, [handlePlay, handlePause, handleResume, handleDelay])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', margin: 0, padding: 0 }}>
      <video
        ref={videoRef}
        controls={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          visibility: black ? 'hidden' : 'visible'
        }}
      />
      {black && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'black'
          }}
        />
      )}
    </div>
  )
}

export default TrainProjection
