import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/require';
import { getDb } from '@/lib/db';
import {
  RegistryStaleError,
  reorderArtifactTemplates,
} from '@/lib/registry/store';
import { RegistryValidationError } from '@/lib/registry/validate';

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const templates = reorderArtifactTemplates(
      getDb(),
      (body as { items?: unknown }).items
    );
    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof RegistryValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof RegistryStaleError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error reordering artifact templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
