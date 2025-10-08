const textEncoder = new TextEncoder();

const possibleSignatureHeaders = ['x-polar-signature', 'webhook-signature', 'polar-signature'];

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function normalizePolarSignature(signature: string): string {
  let normalized = signature.trim();

  normalized = normalized.replace(/^(sha256=|hmac-sha256=)/, '');

  if (normalized.includes('v1=')) {
    const v1Match = normalized.match(/v1=([a-zA-Z0-9+/=]+)/);
    if (v1Match) normalized = v1Match[1];
  } else if (normalized.includes('v1,')) {
    const parts = normalized.split('v1,');
    if (parts.length > 1) normalized = parts[1];
  }

  if (normalized.includes('t=') && normalized.includes(',v1=')) {
    const v1Match = normalized.match(/,v1=([a-zA-Z0-9+/=]+)/);
    if (v1Match) normalized = v1Match[1];
  }

  return normalized.trim();
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

interface SignatureVerificationErrorOptions {
  status?: number;
  responseMessage?: string;
  details?: Record<string, unknown>;
}

export class SignatureVerificationError extends Error {
  status: number;
  responseMessage: string;
  details?: Record<string, unknown>;

  constructor(message: string, options: SignatureVerificationErrorOptions = {}) {
    super(message);
    this.name = 'SignatureVerificationError';
    this.status = options.status ?? 401;
    this.responseMessage = options.responseMessage ?? message;
    this.details = options.details;
  }
}

interface VerifyOptions {
  body: string;
  headers: Headers;
  webhookSecret: string;
}

interface SignatureVerificationResult {
  format: 'base64' | 'hex';
  signatureLength: number;
}

export async function verifyPolarSignature({ body, headers, webhookSecret }: VerifyOptions): Promise<SignatureVerificationResult> {
  let signature: string | null = null;
  for (const headerName of possibleSignatureHeaders) {
    const value = headers.get(headerName);
    if (value) {
      signature = value;
      break;
    }
  }

  if (!signature) {
    const headerNames = Array.from(headers.keys());
    throw new SignatureVerificationError('Missing Polar signature header', {
      status: 401,
      responseMessage: 'Missing webhook signature',
      details: { headerNames },
    });
  }

  const normalizedSignature = normalizePolarSignature(signature);

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
  const expectedHex = toHex(expectedBuffer);
  const expectedBase64 = toBase64(expectedBuffer);

  const isValidBase64 = timingSafeEquals(normalizedSignature, expectedBase64);
  const isValidHex = timingSafeEquals(normalizedSignature, expectedHex);

  if (!isValidBase64 && !isValidHex) {
    throw new SignatureVerificationError('Invalid webhook signature', {
      status: 401,
      responseMessage: 'Invalid signature',
      details: {
        valid: false,
        received: normalizedSignature.substring(0, 8) + '...',
        receivedLength: normalizedSignature.length,
        expectedBase64: expectedBase64.substring(0, 8) + '...',
        expectedHex: expectedHex.substring(0, 8) + '...',
        matchedFormat: 'none'
      }
    });
  }

  return {
    format: isValidBase64 ? 'base64' : 'hex',
    signatureLength: normalizedSignature.length,
  };
}
