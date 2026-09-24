import { NextResponse } from 'next/server';

/**
 * Order bridge — forwards a customer order from this digital menu to the
 * Digital Race "Restaurant Admin" panel (Digital Race backend).
 *
 * Configure the panel base URL with PANEL_API_URL (default: http://127.0.0.1:3001).
 */
const PANEL_API_URL = process.env.PANEL_API_URL || 'http://127.0.0.1:3001';
const TENANT_SLUG = 'cafe-umbrella';

interface IncomingItem {
  panelId?: string;
  quantity?: number;
}

export async function POST(req: Request) {
  let body: {
    items?: IncomingItem[];
    customer?: { name?: string; phone?: string; email?: string };
    tableNumber?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const items = (body.items ?? [])
    .filter((i) => i?.panelId)
    .map((i) => ({ productId: String(i.panelId), quantity: Math.max(1, Math.min(99, Number(i.quantity) || 1)) }));

  if (items.length === 0) {
    return NextResponse.json({ success: false, error: 'Order items cannot be empty' }, { status: 400 });
  }

  const name = body.customer?.name?.trim().slice(0, 120) || undefined;
  const phone = body.customer?.phone?.trim().slice(0, 40) || undefined;
  const email = body.customer?.email?.trim().slice(0, 160) || undefined;
  const notesParts = [
    email ? `Email: ${email}` : '',
    'Sent from the Cafe Umbrella digital menu',
  ].filter(Boolean);

  try {
    const res = await fetch(`${PANEL_API_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug: TENANT_SLUG,
        tableNumber: body.tableNumber ?? 1,
        items,
        customerName: name,
        customerPhone: phone,
        notes: notesParts.join(' · '),
      }),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => null)) as
      | { success?: boolean; order?: { id?: string; total?: number }; error?: string }
      | null;

    if (!res.ok || !data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || `Panel responded ${res.status}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      kitchenOrderId: data.order?.id ?? null,
      total: data.order?.total ?? null,
    });
  } catch (err) {
    // Never block the customer because the panel is unreachable — WhatsApp handoff still works.
    console.warn('[ORDER_FORWARD_SKIP]', (err as Error)?.message);
    return NextResponse.json({ success: false, error: 'Kitchen panel unreachable' }, { status: 202 });
  }
}
