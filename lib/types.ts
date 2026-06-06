// lib/types.ts
// Core TypeScript types for Mission Market

export type SessionStatus = 'lobby' | 'active' | 'paused' | 'ended'
export type RoundStatus = 'open' | 'locked' | 'resolved'
export type PathKey = 'stable' | 'popular' | 'success' | 'foundation'
export type VisibleTrend = 'steady' | 'rising' | 'falling' | 'surging' | 'uncertain'
export type RiggingMode = 'random' | 'scripted' | 'override'
export type EventType =
  | 'hype_surge'
  | 'market_drop'
  | 'stable_boost'
  | 'foundation_surge'
  | 'full_reset'
  | 'round_resolved'
  | 'player_joined'
  | 'path_switched'
  | 'game_started'
  | 'game_ended'
  | 'intro_shown'
  | 'intro_dismissed'

export interface Session {
  id: string
  session_code: string
  status: SessionStatus
  current_round: number
  show_intro: boolean
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export interface Player {
  id: string
  session_id: string
  display_name: string
  credits: number
  current_path_id: string | null
  is_connected: boolean
  joined_at: string
}

export interface Path {
  id: string
  session_id: string
  name: string
  key: PathKey
  description: string
  tagline: string
  current_value: number
  hidden_target_value: number
  visible_trend: VisibleTrend
  volatility: number
  min_change: number
  max_change: number
  is_locked: boolean
  trend_override: string | null
  rigging_mode: RiggingMode
  scripted_values: number[] | null // array of per-round multipliers
  player_count: number
}

export interface Round {
  id: string
  session_id: string
  round_number: number
  status: RoundStatus
  duration_seconds: number
  started_at: string
  locked_at: string | null
  resolved_at: string | null
}

export interface Choice {
  id: string
  session_id: string
  round_id: string
  player_id: string
  path_id: string
  created_at: string
}

export interface GameEvent {
  id: string
  session_id: string
  event_type: EventType
  message: string
  payload: Record<string, unknown> | null
  triggered_by: string
  triggered_at: string
}

export interface LeaderboardSnapshot {
  id: string
  session_id: string
  round_id: string
  player_id: string
  rank: number
  credits: number
  created_at: string
}

export interface LeaderboardEntry {
  player_id: string
  display_name: string
  credits: number
  rank: number
  current_path_id: string | null
}

// Path metadata used for display
export const PATH_META: Record<PathKey, {
  name: string
  description: string
  tagline: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  glowClass: string
  icon: string
}> = {
  stable: {
    name: 'Stable Path',
    description: 'Steady. Predictable. Low drama.',
    tagline: 'This path grows slowly but safely.',
    color: '#3B82F6',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/40',
    glowClass: 'shadow-blue-500/30',
    icon: '🛡️',
  },
  popular: {
    name: 'Popular Path',
    description: 'Everyone is talking about it.',
    tagline: 'This one looks exciting, but it changes a lot.',
    color: '#A855F7',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40',
    glowClass: 'shadow-purple-500/30',
    icon: '🔥',
  },
  success: {
    name: 'Success Path',
    description: 'Big reward, big risk.',
    tagline: 'High chance of a fast lead — or a big fall.',
    color: '#F59E0B',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    glowClass: 'shadow-amber-500/30',
    icon: '⚡',
  },
  foundation: {
    name: 'Foundation Path',
    description: 'Looks quiet now. Could take time.',
    tagline: 'This path has been quiet for a while.',
    color: '#10B981',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    glowClass: 'shadow-emerald-500/30',
    icon: '🌱',
  },
}
