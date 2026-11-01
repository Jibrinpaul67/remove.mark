
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { MaskRegion, PixelRegion } from '../types/mask'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
  regions: MaskRegion[]
  onChange: (regions: MaskRegion[]) => void
  onPixelRegionsChange: (regions: PixelRegion[]) => void
}

type Action =
  | { type: 'draw'; id: string; x: number; y: number }
  | { type: 'move'; id: string; x: number; y: number; original: MaskRegion }
  | { type: 'resize'; id: string; x: number; y: number; handle: string; original: MaskRegion }

const MIN_SIZE = 0.005

const handles = [
  ['nw', 'left-0 top-0 -translate-x-1/2 -translate-y-1/2'],
  ['n', 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'],
  ['ne', 'right-0 top-0 translate-x-1/2 -translate-y-1/2'],
  ['w', 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'],
  ['e', 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'],
  ['sw', 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2'],
  ['s', 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'],
  ['se', 'bottom-0 right-0 translate-x-1/2 translate-y-1/2'],
] as const

export default function MaskCanvas({
  videoRef,
  regions,
  onChange,
  onPixelRegionsChange,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<Action | null>(null)

  const [bounds, setBounds] = useState({
    left: 0, top: 0, width: 0, height: 0,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawMode, setDrawMode] = useState(true)

  const updateBounds = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayRef.current

    if (!video || !overlay || !video.videoWidth || !video.videoHeight) return

    const v = video.getBoundingClientRect()
    const o = overlay.getBoundingClientRect()

    const ratio = video.videoWidth / video.videoHeight
    const boxRatio = v.width / v.height

    const width = ratio > boxRatio ? v.width : v.height * ratio
    const height = ratio > boxRatio ? v.width / ratio : v.height

    setBounds({
      left: v.left - o.left + (v.width - width) / 2,
      top: v.top - o.top + (v.height - height) / 2,
      width,
      height,
    })
  }, [videoRef])

  useEffect(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    if (!video || !overlay) return

    updateBounds()

    const observer = new ResizeObserver(updateBounds)
    observer.observe(video)
    observer.observe(overlay)

    video.addEventListener('loadedmetadata', updateBounds)
    window.addEventListener('resize', updateBounds)

    return () => {
      observer.disconnect()
      video.removeEventListener('loadedmetadata', updateBounds)
      window.removeEventListener('resize', updateBounds)
    }
  }, [updateBounds, videoRef])

  useEffect(() => {
    const video = videoRef.current

    if (!video?.videoWidth || !video.videoHeight) {
      onPixelRegionsChange([])
      return
    }

    onPixelRegionsChange(regions.map(region => {
      const x = Math.round(region.x * video.videoWidth)
      const y = Math.round(region.y * video.videoHeight)
      const right = Math.round((region.x + region.width) * video.videoWidth)
      const bottom = Math.round((region.y + region.height) * video.videoHeight)

      return {
        x,
        y,
        width: right - x,
        height: bottom - y,
      }
    }))
  }, [regions, videoRef, onPixelRegionsChange])

  const getPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()

    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    }
  }

  function startDraw(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !drawMode) return

    const point = getPoint(event)
    const id = crypto.randomUUID()

    actionRef.current = {
      type: 'draw',
      id,
      ...point,
    }

    setSelectedId(id)

    onChange([
      ...regions,
      { id, x: point.x, y: point.y, width: 0, height: 0 },
    ])

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function startMove(event: PointerEvent<HTMLDivElement>, region: MaskRegion) {
    if (event.button !== 0) return

    event.stopPropagation()
    const point = getPoint(event)

    actionRef.current = {
      type: 'move',
      id: region.id,
      ...point,
      original: { ...region },
    }

    setSelectedId(region.id)
    setDrawMode(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function startResize(
    event: PointerEvent<HTMLDivElement>,
    region: MaskRegion,
    handle: string,
  ) {
    if (event.button !== 0) return

    event.stopPropagation()
    const point = getPoint(event)

    actionRef.current = {
      type: 'resize',
      id: region.id,
      handle,
      ...point,
      original: { ...region },
    }

    setSelectedId(region.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const action = actionRef.current
    if (!action) return

    const point = getPoint(event)
    const dx = point.x - action.x
    const dy = point.y - action.y

    if (action.type === 'draw') {
      const updated: MaskRegion = {
        id: action.id,
        x: Math.min(action.x, point.x),
        y: Math.min(action.y, point.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      }

      onChange([...regions.filter(r => r.id !== action.id), updated])
      return
    }

    const original = action.original
    let updated: MaskRegion

    if (action.type === 'move') {
      updated = {
        ...original,
        x: Math.max(0, Math.min(1 - original.width, original.x + dx)),
        y: Math.max(0, Math.min(1 - original.height, original.y + dy)),
      }
    } else {
      let left = original.x
      let top = original.y
      let right = original.x + original.width
      let bottom = original.y + original.height

      if (action.handle.includes('w')) {
        left = Math.max(0, Math.min(right - MIN_SIZE, original.x + dx))
      }
      if (action.handle.includes('e')) {
        right = Math.min(1, Math.max(left + MIN_SIZE, right + dx))
      }
      if (action.handle.includes('n')) {
        top = Math.max(0, Math.min(bottom - MIN_SIZE, original.y + dy))
      }
      if (action.handle.includes('s')) {
        bottom = Math.min(1, Math.max(top + MIN_SIZE, bottom + dy))
      }

      updated = {
        id: original.id,
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      }
    }

    onChange(regions.map(r => r.id === action.id ? updated : r))
  }

  function finishAction() {
    const action = actionRef.current

    if (action?.type === 'draw') {
      const created = regions.find(r => r.id === action.id)

      if (created && (created.width < MIN_SIZE || created.height < MIN_SIZE)) {
        onChange(regions.filter(r => r.id !== action.id))
        setSelectedId(null)
      }
    }

    actionRef.current = null
  }

  function deleteSelected() {
    onChange(regions.filter(r => r.id !== selectedId))
    setSelectedId(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium">
          Watermark regions
          <span className="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-400">
            {regions.length}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setDrawMode(true)}
            className={`rounded-lg px-3 py-2 text-xs ${
              drawMode ? 'bg-lime-300 text-black' : 'border border-white/10 text-zinc-300'
            }`}
          >
            <Plus size={14} className="mr-1 inline" />
            Draw region
          </button>

          <button
            onClick={deleteSelected}
            disabled={!selectedId}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-30"
          >
            <Trash2 size={14} className="mr-1 inline" />
            Delete
          </button>

          <button
            onClick={() => {
              onChange([])
              setSelectedId(null)
              setDrawMode(true)
            }}
            disabled={!regions.length}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-30"
          >
            Clear all
          </button>
        </div>
      </div>

      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10"
      >
        <div
          className="pointer-events-auto absolute touch-none"
          style={{
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            cursor: drawMode ? 'crosshair' : 'default',
          }}
          onPointerDown={startDraw}
          onPointerMove={handleMove}
          onPointerUp={finishAction}
          onPointerCancel={finishAction}
        >
          {regions.map((region, index) => {
            const selected = region.id === selectedId

            return (
              <div
                key={region.id}
                onPointerDown={event => startMove(event, region)}
                className={`absolute touch-none ${
                  selected
                    ? 'border-2 border-lime-300 bg-lime-300/15'
                    : 'border border-white/80 bg-white/5'
                }`}
                style={{
                  left: `${region.x * 100}%`,
                  top: `${region.y * 100}%`,
                  width: `${region.width * 100}%`,
                  height: `${region.height * 100}%`,
                  cursor: 'move',
                }}
              >
                {selected && (
                  <>
                    <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-lime-300 px-2 py-1 text-[10px] font-semibold text-black">
                      Region {index + 1}
                    </span>

                    {handles.map(([handle, position]) => (
                      <div
                        key={handle}
                        onPointerDown={event => startResize(event, region, handle)}
                        className={`absolute ${position} h-3 w-3 rounded-sm border border-black bg-lime-300`}
                        style={{ cursor: `${handle}-resize` }}
                      />
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Draw a rectangle over an authorised edit region. Drag it to move, or
        drag its handles to resize.
      </p>
    </div>
  )
}
