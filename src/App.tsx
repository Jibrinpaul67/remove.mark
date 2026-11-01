
import { useState } from 'react'
import { ShieldCheck, Sparkles, Video } from 'lucide-react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import VideoWorkspace from './components/VideoWorkspace'
import { useVideoFile } from './hooks/useVideoFile'

export default function App() {
  const {
    file,
    setFile,
    videoUrl,
    videoInfo,
    readVideoInfo,
  } = useVideoFile()

  const [notice, setNotice] = useState('')

  function selectFile(selectedFile: File) {
    setFile(selectedFile)
    setNotice('')
  }

  function removeFile() {
    setFile(null)
    setNotice('')
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-zinc-100">
      <Header />

      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.07] px-3 py-1.5 text-xs text-lime-300">
            <ShieldCheck size={14} />
            Private by design
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Restore the frame.
            <br />
            <span className="text-lime-300">Keep it yours.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            Clean up videos directly in your browser. Select an area, restore
            the image and keep your files on your device.
          </p>
        </div>

        {file && videoUrl ? (
          <VideoWorkspace
            file={file}
            videoUrl={videoUrl}
            videoInfo={videoInfo}
            onVideoLoaded={readVideoInfo}
            onRemove={removeFile}
          />
        ) : (
          <div className="mx-auto max-w-3xl">
            <UploadZone onFileSelect={selectFile} />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Local processing',
                  description: 'Your video stays on your device.',
                },
                {
                  icon: Video,
                  title: 'Preview first',
                  description: 'Inspect your video before editing.',
                },
                {
                  icon: Sparkles,
                  title: 'AI restoration',
                  description: 'Advanced reconstruction is coming next.',
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 p-4"
                >
                  <Icon size={19} className="text-lime-300" />
                  <h2 className="mt-3 text-sm font-medium">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {notice && (
          <p role="status" className="mt-6 text-center text-sm text-zinc-400">
            {notice}
          </p>
        )}

        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-xs text-zinc-600">
          FrameMend · Browser-based video restoration
        </footer>
      </div>
    </main>
  )
}
