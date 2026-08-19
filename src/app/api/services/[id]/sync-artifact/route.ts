import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/require';
import { getDb } from '@/lib/db';
import { parseServiceId } from '@/lib/service-id';
import {
  ServiceNotFoundError,
  ServiceStaleError,
  syncArtifactToService,
} from '@/lib/registry/service-snapshot';

/**
 * POST /api/services/[id]/sync-artifact — Admin-only AD-16 re-clone.
 * Any signed-in account reaches this path through the proxy; the route
 * re-checks Admin from SQLite (AD-14).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const serviceId = parseServiceId(id);
    if (serviceId === null) {
      return NextResponse.json({ error: 'Invalid Service ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const updatedAt = (body as { updated_at?: unknown }).updated_at;
    if (typeof updatedAt !== 'string' || updatedAt.trim() === '') {
      return NextResponse.json(
        { error: 'updated_at is required for concurrent edit protection' },
        { status: 400 }
      );
    }

    const result = syncArtifactToService(getDb(), serviceId, updatedAt.trim());
    return NextResponse.json({
      message: 'Artifact registry synced',
      updated_at: result.updatedAt,
      templateCount: result.templateCount,
    });
  } catch (error) {
    if (error instanceof ServiceNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ServiceStaleError) {
      return NextResponse.json(
        { error: error.message, updated_at: error.updatedAt },
        { status: 409 }
      );
    }
    console.error('Error syncing artifact registry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
