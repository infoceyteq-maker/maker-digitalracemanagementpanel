import { NextResponse } from 'next/server';
import { createRestaurantTenant } from '@/src/actions/tenantActions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createRestaurantTenant(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('[API_TENANT_PROVISION_ERROR]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to provision restaurant tenant.' },
      { status: 500 }
    );
  }
}
