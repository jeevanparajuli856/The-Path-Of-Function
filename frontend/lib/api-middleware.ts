import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyAdminToken, AdminTokenPayload } from './jwt';

export async function requireAdmin(
  req: Request
): Promise<{ payload: AdminTokenPayload } | NextResponse> {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyAdminToken(token);
    return { payload };
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
