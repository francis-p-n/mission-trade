import { getJoinUrl, generateQRCodeDataUrl } from '../qr'
import QRCode from 'qrcode'

jest.mock('qrcode')

describe('qr utils', () => {
  describe('getJoinUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('uses localhost if NEXT_PUBLIC_BASE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_BASE_URL
      expect(getJoinUrl('XYZ1')).toBe('http://localhost:3000/join/XYZ1')
    })

    it('uses NEXT_PUBLIC_BASE_URL if set', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://mygame.com'
      expect(getJoinUrl('XYZ1')).toBe('https://mygame.com/join/XYZ1')
    })
  })

  describe('generateQRCodeDataUrl', () => {
    it('generates a data url', async () => {
      ;(QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mocked')
      const result = await generateQRCodeDataUrl('XYZ1')
      expect(result).toBe('data:image/png;base64,mocked')
      expect(QRCode.toDataURL).toHaveBeenCalled()
    })

    it('returns empty string on error', async () => {
      ;(QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('Mock Error'))
      // suppress console.error for clean test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const result = await generateQRCodeDataUrl('XYZ1')
      expect(result).toBe('')
      consoleSpy.mockRestore()
    })
  })
})
