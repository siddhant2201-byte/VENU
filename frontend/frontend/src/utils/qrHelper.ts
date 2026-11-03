import QRCode from 'qrcode';

const qrCache = new Map<string, string>();

export async function generateQrDataUrl(text: string): Promise<string> {
  if (!text) return '';
  if (qrCache.has(text)) {
    return qrCache.get(text)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    qrCache.set(text, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate client QR code for:', text, err);

    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(text)}`;
    return fallbackUrl;
  }
}

export function getCachedQrDataUrl(text: string): string | null {
  return qrCache.get(text) || null;
}
