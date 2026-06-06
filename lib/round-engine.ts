// lib/round-engine.ts
// Handles round lifecycle and path value calculation

import { supabase } from './supabase'
import type { Path, Round, Player, Choice } from './types'

export async function startRound(sessionId: string, durationSeconds = 60): Promise<Round | null> {
  // Get current round number
  const { data: session } = await supabase
    .from('sessions')
    .select('current_round')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const nextRound = (session.current_round || 0) + 1

  const { data: round, error } = await supabase
    .from('rounds')
    .insert({
      session_id: sessionId,
      round_number: nextRound,
      status: 'open',
      duration_seconds: durationSeconds,
    })
    .select()
    .single()

  if (error) { console.error('Start round error:', error); return null }

  await supabase
    .from('sessions')
    .update({ current_round: nextRound })
    .eq('id', sessionId)

  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'game_started',
    message: `Round ${nextRound} is now live. Choose your path!`,
    triggered_by: 'system',
  })

  return round
}

export async function lockRound(roundId: string, sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('rounds')
    .update({ status: 'locked', locked_at: new Date().toISOString() })
    .eq('id', roundId)

  if (error) return false

  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'round_resolved',
    message: 'Choices are locked. Calculating results...',
    triggered_by: 'system',
  })

  return true
}

export async function resolveRound(roundId: string, sessionId: string): Promise<boolean> {
  // 1. Get paths for this session
  const { data: paths } = await supabase
    .from('paths')
    .select('*')
    .eq('session_id', sessionId)

  if (!paths) return false

  // 2. Get the current round number
  const { data: round } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('id', roundId)
    .single()

  if (!round) return false

  // 3. Calculate new values for each path
  const pathUpdates: { id: string; current_value: number; visible_trend: string; player_count: number }[] = []

  for (const path of paths as Path[]) {
    const newValue = calculateNewValue(path, round.round_number)
    const trend = calculateTrend(path.current_value, newValue)

    pathUpdates.push({
      id: path.id,
      current_value: newValue,
      visible_trend: trend,
      player_count: path.player_count,
    })
  }

  // 4. Update path values
  for (const update of pathUpdates) {
    await supabase
      .from('paths')
      .update({
        current_value: update.current_value,
        visible_trend: update.visible_trend,
      })
      .eq('id', update.id)
  }

  // 5. Get all choices for this round
  const { data: choices } = await supabase
    .from('choices')
    .select('player_id, path_id')
    .eq('round_id', roundId)

  if (choices) {
    // 6. Update player credits
    for (const choice of choices as Choice[]) {
      const oldPath = paths.find((p) => p.id === choice.path_id) as Path | undefined
      const newPath = pathUpdates.find((p) => p.id === choice.path_id)

      if (oldPath && newPath) {
        const growthMultiplier = newPath.current_value / oldPath.current_value

        const { data: player } = await supabase
          .from('players')
          .select('credits')
          .eq('id', choice.player_id)
          .single()

        if (player) {
          const newCredits = Math.round(player.credits * growthMultiplier)
          await supabase
            .from('players')
            .update({ credits: newCredits, current_path_id: choice.path_id })
            .eq('id', choice.player_id)
        }
      }
    }
  }

  // 7. Mark round resolved
  await supabase
    .from('rounds')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', roundId)

  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'round_resolved',
    message: `Round ${round.round_number} resolved. Leaderboard updated.`,
    triggered_by: 'system',
  })

  return true
}

function calculateNewValue(path: Path, roundNumber: number): number {
  const current = path.current_value

  if (path.rigging_mode === 'scripted' && path.scripted_values) {
    const idx = Math.min(roundNumber - 1, path.scripted_values.length - 1)
    const multiplier = 1 + path.scripted_values[idx]
    return Math.max(1, Math.round(current * multiplier * 100) / 100)
  }

  if (path.rigging_mode === 'override') {
    return path.hidden_target_value
  }

  // Random mode: weighted random within min/max
  const range = path.max_change - path.min_change
  const change = path.min_change + Math.random() * range
  return Math.max(1, Math.round(current * (1 + change) * 100) / 100)
}

function calculateTrend(oldValue: number, newValue: number): string {
  const change = (newValue - oldValue) / oldValue
  if (change > 0.15) return 'surging'
  if (change > 0.02) return 'rising'
  if (change < -0.05) return 'falling'
  if (change < -0.01) return 'falling'
  return 'steady'
}

// Event triggers
export async function triggerHypeSurge(sessionId: string): Promise<boolean> {
  const { data: paths } = await supabase.from('paths').select('*').eq('session_id', sessionId)
  if (!paths) return false

  const popularPath = paths.find((p) => p.key === 'popular')
  if (!popularPath) return false

  const newValue = Math.round(popularPath.current_value * 1.2 * 100) / 100
  await supabase.from('paths').update({ current_value: newValue, visible_trend: 'surging' }).eq('id', popularPath.id)
  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'hype_surge',
    message: '🔥 Hype Surge! The Popular Path is exploding with attention.',
    triggered_by: 'admin',
  })
  return true
}

export async function triggerMarketDrop(sessionId: string): Promise<boolean> {
  const { data: paths } = await supabase.from('paths').select('*').eq('session_id', sessionId)
  if (!paths) return false

  for (const path of paths) {
    if (path.key === 'foundation') continue
    const newValue = Math.round(path.current_value * 0.82 * 100) / 100
    await supabase.from('paths').update({ current_value: newValue, visible_trend: 'falling' }).eq('id', path.id)
  }

  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'market_drop',
    message: '📉 Market Drop! Most paths took a hit.',
    triggered_by: 'admin',
  })
  return true
}

export async function triggerStableBoost(sessionId: string): Promise<boolean> {
  const { data: paths } = await supabase.from('paths').select('*').eq('session_id', sessionId)
  if (!paths) return false

  const stablePath = paths.find((p) => p.key === 'stable')
  if (!stablePath) return false

  const newValue = Math.round(stablePath.current_value * 1.08 * 100) / 100
  await supabase.from('paths').update({ current_value: newValue, visible_trend: 'rising' }).eq('id', stablePath.id)
  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'stable_boost',
    message: '🛡️ Stable Boost! Steady wins the race.',
    triggered_by: 'admin',
  })
  return true
}

export async function triggerFoundationSurge(sessionId: string): Promise<boolean> {
  const { data: paths } = await supabase.from('paths').select('*').eq('session_id', sessionId)
  if (!paths) return false

  const foundationPath = paths.find((p) => p.key === 'foundation')
  if (!foundationPath) return false

  const newValue = Math.round(foundationPath.current_value * 1.5 * 100) / 100
  await supabase.from('paths').update({ current_value: newValue, visible_trend: 'surging' }).eq('id', foundationPath.id)
  await supabase.from('events').insert({
    session_id: sessionId,
    event_type: 'foundation_surge',
    message: '🌱 FOUNDATION SURGE! The patient path reveals its true power!',
    triggered_by: 'admin',
  })
  return true
}
