import { ShieldCheck, Sparkles, ExternalLink } from 'lucide-react'

export default function Header() {
  return (
    <header className="flex h-[76px] items-center justify-between border-b border-white/10 px-5 sm:px-10">
      <a href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-black">
          <Sparkles size={22} strokeWidth={2.5} />
        </div>

        <div>
          <p className="text-lg font-bold tracking-tight">
            Frame<span className="text-lime-300">Mend</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Local video restoration
          </p>
        </div>
      </a>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
          <ShieldCheck size={16} className="text-lime-300" />
          Your files stay on your device
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="rounded-xl border border-white/10 p-2.5 text-zinc-300 transition hover:bg-white/5"
        >
         <ExternalLink size={19} />
        </a>
      </div>
    </header>
  )
}
