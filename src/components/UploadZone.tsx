
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileVideo, ShieldCheck, FolderOpen } from 'lucide-react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

const MAX_FILE_SIZE = 500 * 1024 * 1024

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function acceptFile(file?: File) {
    if (!file) return

    const supportedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-m4v',
    ]

    const validExtension = /\.(mp4|mov|webm|m4v)$/i.test(file.name)
    const validType =
      supportedTypes.includes(file.type) ||
      (file.type === '' && validExtension)

    if (!validType) {
      setError('Choose an MP4, MOV, WEBM or M4V video.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Your video must be 500 MB or smaller for this version.')
      return
    }

    setError('')
    onFileSelect(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0])
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false)
        }
      }}
      onDrop={handleDrop}
      className={`rounded-3xl border border-dashed p-7 text-center transition sm:p-12 ${
        dragging
          ? 'border-lime-300 bg-lime-300/10'
          : 'border-white/15 bg-white/[0.02] hover:border-white/30'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
        className="hidden"
        onChange={handleChange}
      />

      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-300">
        {dragging ? <FileVideo size={30} /> : <Upload size={30} />}
      </div>

      <h2 className="text-xl font-semibold sm:text-2xl">
        Drop your video here
      </h2>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
        Choose a video to preview it and select the area you want to restore.
        Your video is processed locally.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-200"
      >
        <FolderOpen size={17} />
        Choose video
      </button>

      <p className="mt-4 text-xs text-zinc-500">
        MP4, MOV, WEBM or M4V · Up to 500 MB
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-xs text-zinc-400">
        <ShieldCheck size={15} className="text-lime-300" />
        No video upload to a processing server
      </div>
    </div>
  )
}
