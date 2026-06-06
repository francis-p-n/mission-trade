import { createSession, startGame, pauseGame, resumeGame, endGame, resetGame, showIntro, dismissIntro } from '../session-engine'
import { supabase } from '../supabase'

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('session-engine', () => {
  let builder: any

  beforeEach(() => {
    jest.clearAllMocks()
    builder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      then: jest.fn(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(builder)
  })

  describe('createSession', () => {
    it('creates a session and paths', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ data: { id: 'mock-session-id', session_code: 'ABCD' }, error: null })) // insert session
        .mockImplementationOnce((res: any) => res({ error: null })) // insert paths

      const result = await createSession()

      expect(result).toHaveProperty('sessionCode')
      expect(result).toHaveProperty('sessionId', 'mock-session-id')
      expect(supabase.from).toHaveBeenCalledWith('sessions')
      expect(supabase.from).toHaveBeenCalledWith('paths')
    })

    it('returns null on failure', async () => {
      builder.then.mockImplementationOnce((res: any) => res({
        data: null,
        error: { code: '500', message: 'Internal Error' },
      }))

      const result = await createSession()
      expect(result).toBeNull()
    })
  })

  describe('game state transitions', () => {
    it('startGame updates status and logs event', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ error: null })) // update session
        .mockImplementationOnce((res: any) => res({ error: null })) // insert event

      const result = await startGame('sess-1')
      expect(result).toBe(true)
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }))
    })

    it('pauseGame updates status', async () => {
      builder.then.mockImplementationOnce((res: any) => res({ error: null }))
      const result = await pauseGame('sess-1')
      expect(result).toBe(true)
      expect(builder.update).toHaveBeenCalledWith({ status: 'paused' })
    })

    it('endGame updates status and logs event', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ error: null }))
        .mockImplementationOnce((res: any) => res({ error: null }))

      const result = await endGame('sess-1')
      expect(result).toBe(true)
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ended' }))
    })
  })

  describe('intro transitions', () => {
    it('showIntro updates session and adds event', async () => {
      builder.then
        .mockImplementationOnce((res: any) => res({ error: null }))
        .mockImplementationOnce((res: any) => res({ error: null }))

      const result = await showIntro('sess-1')
      expect(result).toBe(true)
      expect(builder.update).toHaveBeenCalledWith({ show_intro: true })
    })
  })
})
