'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PresenterIndexPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleGoTo(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (c.length < 4) {
      setError('Please enter a valid 4-character session code.')
      return
    }
    router.push(`/presenter/${c}`)
  }

  return (
    <main className="min-h-dvh grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <div className="text-5xl mb-3">📺</div>
          <h1 className="text-2xl font-black text-white">Presenter View</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your session code to open the presenter screen</p>
        </div>
        <form onSubmit={handleGoTo} className="glass rounded-2xl p-6 space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Session Code (e.g. K7F2)"
            maxLength={4}
            className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all active:scale-95"
          >
            Open Presenter View
          </button>
        </form>
      </div>
    </main>
  )
}
