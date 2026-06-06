// lib/qr.ts
// QR code generation utilities

import QRCode from 'qrcode'

export function getJoinUrl(sessionCode: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${base}/join/${sessionCode}`
}

export async function generateQRCodeDataUrl(sessionCode: string): Promise<string> {
  const url = getJoinUrl(sessionCode)
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#FFFFFF',
        light: '#00000000',
      },
      errorCorrectionLevel: 'H',
    })
    return dataUrl
  } catch (err) {
    console.error('QR generation error:', err)
    return ''
  }
}
