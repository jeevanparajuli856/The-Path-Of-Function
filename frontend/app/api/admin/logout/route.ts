import { NextResponse } from 'next/server';

// Token is discarded client-side; this endpoint just confirms logout
export async function POST() {
  return NextResponse.json({ logged_out: true });
}
