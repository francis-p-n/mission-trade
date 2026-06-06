'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/session-engine'

export default function AdminIndexPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [sessionCode, setSessionCode] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect password.')
    }
  }

  async function handleCreate() {
    setCreating(true)
    const result = await createSession()
    if (result) {
      router.push(`/admin/${result.sessionCode}`)
    } else {
      setError('Failed to create session.')
      setCreating(false)
    }
  }

  function handleGoTo(e: React.FormEvent) {
    e.preventDefault()
    const code = sessionCode.trim().toUpperCase()
    if (code.length >= 4) {
      router.push(`/admin/${code}`)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-dvh grid-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-black text-white">Admin Access</h1>
            <p className="text-slate-400 text-sm mt-1">Facilitators only</p>
          </div>
          <form onSubmit={handleLogin} className="glass rounded-2xl p-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all active:scale-95"
            >
              Enter Admin Panel
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-3xl font-black text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your Mission Market session</p>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Create New Session</h2>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {creating ? 'Creating...' : '+ New Session'}
            </button>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Resume Session</h2>
            <form onSubmit={handleGoTo} className="space-y-3">
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Session Code (e.g. K7F2)"
                maxLength={4}
                className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all active:scale-95"
              >
                Go to Session
              </button>
            </form>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </main>
  )
}
