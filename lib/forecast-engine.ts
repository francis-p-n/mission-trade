// lib/forecast-engine.ts
// Produces visible trend labels for students (hides admin data)

import type { Path, VisibleTrend } from './types'

export interface ForecastLabel {
  label: string
  arrow: '↑↑' | '↑' | '→' | '↓' | '↓↓'
  color: string
}

export function getForecastLabel(path: Path): ForecastLabel {
  const trend: VisibleTrend = (path.trend_override as VisibleTrend) || path.visible_trend

  switch (trend) {
    case 'surging':
      return { label: 'Sudden Rise', arrow: '↑↑', color: 'text-emerald-400' }
    case 'rising':
      return { label: 'Growing', arrow: '↑', color: 'text-green-400' }
    case 'steady':
      return { label: 'Steady', arrow: '→', color: 'text-blue-400' }
    case 'falling':
      return { label: 'Falling', arrow: '↓', color: 'text-red-400' }
    case 'uncertain':
      return { label: 'Unclear', arrow: '→', color: 'text-yellow-400' }
    default:
      return { label: 'Steady', arrow: '→', color: 'text-blue-400' }
  }
}

export function getStudentForecastHint(pathKey: string, trend: VisibleTrend): string {
  const hints: Record<string, Record<string, string>> = {
    stable: {
      surging: 'Unusually strong right now.',
      rising: 'Doing better than usual.',
      steady: 'This path grows slowly but safely.',
      falling: 'Having an off round.',
      uncertain: 'A bit hard to read today.',
    },
    popular: {
      surging: 'Everyone is rushing in!',
      rising: 'The crowd is growing.',
      steady: 'Holding steady with the crowd.',
      falling: 'People are moving away.',
      uncertain: 'Hard to predict crowd behavior.',
    },
    success: {
      surging: 'Big gains are happening!',
      rising: 'Looking strong right now.',
      steady: 'Calm before the storm?',
      falling: 'Taking a hit this round.',
      uncertain: 'High chance of a big swing.',
    },
    foundation: {
      surging: 'Something is happening here.',
      rising: 'Slowly picking up.',
      steady: 'This path has been quiet for a while.',
      falling: 'Still waiting for its moment.',
      uncertain: 'Patience may be required.',
    },
  }

  return hints[pathKey]?.[trend] ?? 'Watch this one.'
}
