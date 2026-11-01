
import { useRef, useState, type PointerEvent } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Film,
  Maximize2,
  MousePointer2,
  Play,
  Pause,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react'

interface VideoInfo {
  duration: number
  width: number
  height: number
}

interface Selection {
  x: number
  y: number
  width: number
  height: number
}

interface VideoWorkspaceProps {
  file: File
  videoUrl: string
  videoInfo: VideoInfo | null
  onVideoLoaded: (video: HTMLVideoElement) => void
  onRemove: () => void
}

export default function VideoWorkspace({
  file,
  videoUrl,
  videoInfo,
  onVideoLoaded,
  onRemove,
}: VideoWorkspaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [selection, setSelection] = useState<Selection>({
    x: 65,
    y: 70,
    width: 20,
    height: 15,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  async function togglePlayback() {
    const video = videoRef.current

    if (!video) return

    if (video.paused) {
      try {
        await video.play()
      } catch (error) {
        console.error('Unable to play video:', error)
      }
    } else {
      video.pause()
    }
  }

  function getPointerPosition(
    event: PointerEvent<HTMLDivElement>,
  ) {
    const bounds = previewRef.current?.getBoundingClientRect()

    if (!bounds) return null

    return {
      x: Math.max(
        0,
        Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100),
      ),
      y: Math.max(
        0,
        Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100),
      ),
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return

    const position = getPointerPosition(event)

    if (!position) return

    event.currentTarget.setPointerCapture(event.pointerId)

    setIsDragging(true)
    setDragStart(position)

    setSelection({
      x: position.x,
      y: position.y,
      width: 0,
      height: 0,
    })
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging) return

    const position = getPointerPosition(event)

    if (!position) return

    setSelection({
      x: Math.min(dragStart.x, position.x),
      y: Math.min(dragStart.y, position.y),
      width: Math.abs(position.x - dragStart.x),
      height: Math.abs(position.y - dragStart.y),
    })
  }

  function handlePointerUp() {
    setIsDragging(false)
  }

  function resetSelection() {
    setSelection({
      x: 65,
      y: 70,
      width: 20,
      height: 15,
    })
  }

  function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds)) return '0:00'

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Top navigation */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to upload
        </button>

        <div className="flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs text-lime-300">
          <ShieldCheck size={14} />
          Processed locally
        </div>
      </div>

      {/* File information */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lime-300">
            <Film size={21} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-semibold text-white">
              {file.name}
            </h2>

            <p className="text-xs text-zinc-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
              {videoInfo &&
                ` · ${videoInfo.width} × ${videoInfo.height}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-red-400/30 hover:text-red-400"
        >
          <Trash2 size={15} />
          Remove video
        </button>
      </div>

      {/* Main workspace */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Video preview */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#10131a]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Video preview
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Draw a rectangle around the area you want to restore.
              </p>
            </div>

            <Maximize2 size={17} className="text-zinc-500" />
          </div>

          <div className="bg-black p-3 sm:p-5">
            <div
              ref={previewRef}
              className="relative mx-auto w-full overflow-hidden bg-black"
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className="pointer-events-none block max-h-[65vh] w-full select-none object-contain"
                onLoadedMetadata={(event) =>
                  onVideoLoaded(event.currentTarget)
                }
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                playsInline
              />

              {/* Selection overlay */}
              <div
                className="pointer-events-none absolute border-2 border-lime-300 bg-lime-300/15"
                style={{
                  left: `${selection.x}%`,
                  top: `${selection.y}%`,
                  width: `${selection.width}%`,
                  height: `${selection.height}%`,
                }}
              >
                <div className="absolute -top-7 left-0 whitespace-nowrap rounded-t-md bg-lime-300 px-2 py-1 text-[10px] font-bold text-black">
                  RESTORE AREA
                </div>

                <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-lime-300" />
              </div>

              {isDragging && (
                <div className="pointer-events-none absolute inset-0 border border-lime-300/30" />
              )}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={togglePlayback}
              className="inline-flex items-center gap-2 rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-lime-200"
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? 'Pause' : 'Play'}
            </button>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock3 size={14} />
              {videoInfo
                ? formatDuration(videoInfo.duration)
                : 'Loading video...'}
            </div>
          </div>
        </section>

        {/* Settings panel */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#10131a] p-5">
            <div className="mb-5 flex items-center gap-2">
              <MousePointer2 size={17} className="text-lime-300" />

              <h3 className="text-sm font-semibold text-white">
                Selection tool
              </h3>
            </div>

            <p className="text-sm leading-6 text-zinc-400">
              Click and drag over the video to select the watermark or
              unwanted area.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Selection coordinates
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500">Position X</p>
                  <p className="mt-1 font-mono text-sm text-white">
                    {selection.x.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">Position Y</p>
                  <p className="mt-1 font-mono text-sm text-white">
                    {selection.y.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">Width</p>
                  <p className="mt-1 font-mono text-sm text-white">
                    {selection.width.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">Height</p>
                  <p className="mt-1 font-mono text-sm text-white">
                    {selection.height.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetSelection}
              className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Reset selection
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#10131a] p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-lime-300" />

              <h3 className="text-sm font-semibold text-white">
                Video information
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Format</span>
                <span className="text-zinc-300">
                  {file.name.split('.').pop()?.toUpperCase() || 'Unknown'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Resolution</span>
                <span className="text-zinc-300">
                  {videoInfo
                    ? `${videoInfo.width} × ${videoInfo.height}`
                    : 'Loading...'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Duration</span>
                <span className="text-zinc-300">
                  {videoInfo
                    ? formatDuration(videoInfo.duration)
                    : 'Loading...'}
                </span>
              </div>
            </div>
          </div>

          {/* Processing status */}
          <div className="rounded-2xl border border-lime-300/20 bg-lime-300/5 p-5">
            <div className="flex items-center gap-2 text-lime-300">
              <Sparkles size={17} />
              <h3 className="text-sm font-semibold">
                Restoration engine
              </h3>
            </div>

            <p className="mt-3 text-xs leading-5 text-zinc-400">
              Your selection is ready. The actual video restoration
              engine will be connected in the next development stage.
            </p>

            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-500"
            >
              Processing coming next
            </button>
          </div>
        </aside>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        FrameMend · Your video stays on your device.
      </p>
    </div>
  )
}
