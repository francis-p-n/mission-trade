import { getForecastLabel, getStudentForecastHint } from '../forecast-engine'
import type { Path } from '../types'

describe('forecast-engine', () => {
  describe('getForecastLabel', () => {
    it('returns Surging label', () => {
      const path = { visible_trend: 'surging' } as Path
      expect(getForecastLabel(path)).toEqual({ label: 'Sudden Rise', arrow: '↑↑', color: 'text-emerald-400' })
    })

    it('returns Rising label', () => {
      const path = { visible_trend: 'rising' } as Path
      expect(getForecastLabel(path)).toEqual({ label: 'Growing', arrow: '↑', color: 'text-green-400' })
    })

    it('handles trend_override', () => {
      const path = { visible_trend: 'falling', trend_override: 'surging' } as unknown as Path
      expect(getForecastLabel(path)).toEqual({ label: 'Sudden Rise', arrow: '↑↑', color: 'text-emerald-400' })
    })
  })

  describe('getStudentForecastHint', () => {
    it('returns specific hint for a path and trend', () => {
      expect(getStudentForecastHint('stable', 'rising')).toBe('Doing better than usual.')
    })

    it('returns default fallback hint for unknown path', () => {
      expect(getStudentForecastHint('unknown_path', 'rising')).toBe('Watch this one.')
    })
  })
})
