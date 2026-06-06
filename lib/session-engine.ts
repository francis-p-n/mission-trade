// lib/session-engine.ts
// Handles session lifecycle: create, start, pause, end, reset

import { supabase } from './supabase'
import { PATH_META } from './types'

const STARTING_CREDITS = 500

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createSession(): Promise<{ sessionCode: string; sessionId: string } | null> {
  // Try up to 5 times to get a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSessionCode()

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        session_code: code,
        status: 'lobby',
        current_round: 0,
        show_intro: false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') continue // duplicate code, retry
      console.error('Create session error:', error)
      return null
    }

    // Insert the four paths
    const pathInserts = (Object.keys(PATH_META) as Array<keyof typeof PATH_META>).map((key) => ({
      session_id: session.id,
      name: PATH_META[key].name,
      key,
      description: PATH_META[key].description,
      tagline: PATH_META[key].tagline,
      current_value: 100,
      hidden_target_value: key === 'foundation' ? 200 : 100,
      visible_trend: 'steady' as const,
      volatility: key === 'success' ? 0.12 : key === 'popular' ? 0.08 : key === 'stable' ? 0.02 : 0.01,
      min_change: key === 'stable' ? -0.01 : key === 'popular' ? -0.06 : key === 'success' ? -0.10 : -0.02,
      max_change: key === 'stable' ? 0.03 : key === 'popular' ? 0.08 : key === 'success' ? 0.12 : 0.01,
      is_locked: false,
      rigging_mode: key === 'foundation' ? 'scripted' : 'random',
      scripted_values: key === 'foundation'
        ? [-0.01, -0.02, 0.00, -0.01, 0.01, -0.01, 0.05, 0.25, 0.50]
        : null,
      player_count: 0,
    }))

    const { error: pathError } = await supabase.from('paths').insert(pathInserts)
    if (pathError) {
      console.error('Create paths error:', pathError)
      return null
    }

    return { sessionCode: code, sessionId: session.id }
  }
  return null
}

export async function startGame(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) { console.error('Start game error:', error); return false }

  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'game_started',
    message: 'The game has started. Choose your path!',
    triggered_by: 'admin',
  })

  return true
}

export async function pauseGame(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'paused' })
    .eq('id', sessionId)
  return !error
}

export async function resumeGame(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'active' })
    .eq('id', sessionId)
  return !error
}

export async function endGame(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) { console.error('End game error:', error); return false }

  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'game_ended',
    message: 'The game has ended. Final standings revealed.',
    triggered_by: 'admin',
  })

  return true
}

export async function resetGame(sessionId: string): Promise<boolean> {
  // Reset players credits, paths values, rounds
  const { data: paths } = await supabase.from('paths').select('id, key').eq('session_id', sessionId)

  if (paths) {
    for (const path of paths) {
      await supabase.from('paths').update({
        current_value: 100,
        hidden_target_value: path.key === 'foundation' ? 200 : 100,
        visible_trend: 'steady',
        player_count: 0,
      }).eq('id', path.id)
    }
  }

  await supabase.from('players').update({ credits: STARTING_CREDITS, current_path_id: null }).eq('session_id', sessionId)
  await supabase.from('rounds').delete().eq('session_id', sessionId)
  await supabase.from('choices').delete().eq('session_id', sessionId)
  await supabase.from('events').delete().eq('session_id', sessionId)

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'lobby', current_round: 0, started_at: null, ended_at: null, show_intro: false })
    .eq('id', sessionId)

  return !error
}

export async function showIntro(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({ show_intro: true })
    .eq('id', sessionId)

  if (!error) {
    await supabase.from('events').insert({
      session_id: sessionId,
      event_type: 'intro_shown',
      message: 'Intro screen is now showing.',
      triggered_by: 'admin',
    })
  }
  return !error
}

export async function dismissIntro(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({ show_intro: false })
    .eq('id', sessionId)

  if (!error) {
    await supabase.from('events').insert({
      session_id: sessionId,
      event_type: 'intro_dismissed',
      message: 'Intro dismissed. Game is live.',
      triggered_by: 'admin',
    })
  }
  return !error
}
