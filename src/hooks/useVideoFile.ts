
import { useEffect, useState } from 'react'

export interface VideoInfo {
  duration: number
  width: number
  height: number
}

export function useVideoFile() {
  const [file, setFileState] = useState<File | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)

  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  function setFile(newFile: File | null) {
    setFileState(newFile)
    setVideoInfo(null)

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }

    setVideoUrl(newFile ? URL.createObjectURL(newFile) : null)
  }

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  function readVideoInfo(video: HTMLVideoElement) {
    setVideoInfo({
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    })
  }

  return {
    file,
    setFile,
    videoUrl,
    videoInfo,
    readVideoInfo,
  }
}
