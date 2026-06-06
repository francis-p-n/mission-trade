'use client'

import { useEffect } from 'react'

interface IntroScreenProps {
  exiting: boolean
}

export default function IntroScreen({ exiting }: IntroScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07070d] ${exiting ? 'intro-exiting' : 'intro-entering'}`}
    >
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      {/* Orbiting dots */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/20"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 45}deg) translateX(280px) translateY(-50%)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8 max-w-2xl space-y-8">
        {/* Icon */}
        <div className="text-8xl mb-2" style={{ filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.4))' }}>
          📈
        </div>

        {/* Game title */}
        <div>
          <p className="text-slate-500 text-lg font-medium tracking-widest uppercase mb-3">Welcome to</p>
          <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent leading-none mb-4">
            Mission Market
          </h1>
        </div>

        {/* Main message */}
        <div className="glass rounded-3xl px-10 py-8 border border-emerald-500/20" style={{ boxShadow: '0 0 60px rgba(16,185,129,0.1)' }}>
          <p className="text-3xl md:text-4xl font-black text-white leading-tight">
            The goal is to{' '}
            <span className="text-emerald-400" style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
              gain the most credits
            </span>
          </p>
          <p className="text-slate-400 text-lg mt-4">
            Choose your path wisely each round. The player with the most credits at the end wins.
          </p>
        </div>

        {/* Four paths preview */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '🛡️', name: 'Stable', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
            { icon: '🔥', name: 'Popular', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
            { icon: '⚡', name: 'Success', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
            { icon: '🌱', name: 'Foundation', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
          ].map((path) => (
            <div key={path.name} className={`glass rounded-xl p-3 text-center border ${path.border}`}>
              <div className="text-3xl mb-1">{path.icon}</div>
              <p className={`text-sm font-semibold ${path.color}`}>{path.name}</p>
            </div>
          ))}
        </div>

        {/* Waiting indicator */}
        <div className="flex items-center justify-center gap-3 text-slate-500">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Waiting for the facilitator to begin</span>
        </div>
      </div>
    </div>
  )
}
