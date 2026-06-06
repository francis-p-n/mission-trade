import { startRound, lockRound, triggerHypeSurge } from '../round-engine'
import { supabase } from '../supabase'

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('round-engine', () => {
  let builder: any

  beforeEach(() => {
    jest.clearAllMocks()
    builder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(builder)
  })

  describe('startRound', () => {
    it('starts next round', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ data: { current_round: 0 }, error: null })) // select session
        .mockImplementationOnce((res: any) => res({ data: { id: 'r1', round_number: 1 }, error: null })) // insert round
        .mockImplementationOnce((res: any) => res({ error: null })) // update session
        .mockImplementationOnce((res: any) => res({ error: null })) // insert event

      const result = await startRound('sess-1')
      expect(result).toEqual({ id: 'r1', round_number: 1 })
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ current_round: 1 }))
    })

    it('returns null if session not found', async () => {
      builder.then.mockImplementationOnce((res: any) => res({ data: null, error: null }))
      const result = await startRound('sess-1')
      expect(result).toBeNull()
    })
  })

  describe('lockRound', () => {
    it('updates round status to locked', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ error: null })) // update round
        .mockImplementationOnce((res: any) => res({ error: null })) // insert event

      const result = await lockRound('r1', 'sess-1')
      expect(result).toBe(true)
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'locked' }))
    })
  })

  describe('triggerHypeSurge', () => {
    it('triggers hype surge on popular path', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ data: [{ id: 'p1', key: 'popular', current_value: 100 }], error: null })) // paths
        .mockImplementationOnce((res: any) => res({ error: null })) // update path
        .mockImplementationOnce((res: any) => res({ error: null })) // event

      const result = await triggerHypeSurge('sess-1')
      expect(result).toBe(true)
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ current_value: 120, visible_trend: 'surging' }))
    })
  })
})
