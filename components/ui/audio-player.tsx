"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  src: string
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(0.5)
  const [isMuted, setIsMuted] = React.useState(false)

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
      setCurrentTime(audio.currentTime)
    }

    const setAudioTime = () => setCurrentTime(audio.currentTime)
    const togglePlay = () => setIsPlaying(!audio.paused)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener("loadeddata", setAudioData)
    audio.addEventListener("timeupdate", setAudioTime)
    audio.addEventListener("play", togglePlay)
    audio.addEventListener("pause", togglePlay)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("loadeddata", setAudioData)
      audio.removeEventListener("timeupdate", setAudioTime)
      audio.removeEventListener("play", togglePlay)
      audio.removeEventListener("pause", togglePlay)
      audio.removeEventListener("ended", onEnded)
    }
  }, [src])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = value[0]
      setVolume(value[0])
      if (value[0] === 0) {
        setIsMuted(true)
      } else {
        setIsMuted(false)
      }
    }
  }

  const handleMuteToggle = () => {
    const audio = audioRef.current
    if (audio) {
      audio.muted = !audio.muted
      setIsMuted(audio.muted)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button variant="ghost" size="icon" onClick={handlePlayPause} className="h-8 w-8">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSeek} className="flex-1" />
      <span className="text-sm text-gray-500 tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <Button variant="ghost" size="icon" onClick={handleMuteToggle} className="h-8 w-8">
        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-20" />
    </div>
  )
}
