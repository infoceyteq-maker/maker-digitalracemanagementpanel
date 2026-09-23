// ==============================================================================
// CEYTEQ DIGITAL RACE - SUPABASE CLIENT & REAL-TIME EVENT BUS
// High-performance real-time synchronization for Multi-Tenant Restaurants
// Supports: Supabase Realtime Channels, Live Broadcasts, Database Persistence
// ==============================================================================

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CustomerOrder, WaiterRequest, Tenant } from '../types';

// Supabase project credentials (configured with your project)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://jhvqliimklxrxdwszzfk.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vOEZVjmVUuP7zj2TchK3dQ_2YD5bll7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface RealtimeCallbacks {
  onNewOrder?: (order: CustomerOrder) => void;
  onOrderStatusUpdate?: (orderId: string, status: CustomerOrder['status']) => void;
  onNewWaiterCall?: (call: WaiterRequest) => void;
  onDismissWaiterCall?: (callId: string) => void;
  onTenantUpdate?: (tenant: Tenant) => void;
}

let activeChannel: RealtimeChannel | null = null;

/**
 * Initialize the global real-time synchronization channel
 */
export function subscribeToDigitalRaceRealtime(
  tenantId: string,
  callbacks: RealtimeCallbacks
) {
  if (activeChannel) {
    try {
      supabase.removeChannel(activeChannel);
    } catch {
      // Ignore channel removal error
    }
  }

  const channelName = `tenant-channel-${tenantId}`;
  activeChannel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
    },
  });

  // 1. Listen for Live Customer Orders
  activeChannel.on('broadcast', { event: 'NEW_ORDER' }, (payload) => {
    if (payload?.payload?.order && callbacks.onNewOrder) {
      callbacks.onNewOrder(payload.payload.order);
    }
  });

  // 2. Listen for Live Order Status Updates (Kitchen -> Customer/POS)
  activeChannel.on('broadcast', { event: 'ORDER_STATUS_UPDATE' }, (payload) => {
    if (payload?.payload?.orderId && payload?.payload?.status && callbacks.onOrderStatusUpdate) {
      callbacks.onOrderStatusUpdate(payload.payload.orderId, payload.payload.status);
    }
  });

  // 3. Listen for Live Waiter Assistance Calls (Customer -> Waiter/POS)
  activeChannel.on('broadcast', { event: 'WAITER_CALL' }, (payload) => {
    if (payload?.payload?.call && callbacks.onNewWaiterCall) {
      callbacks.onNewWaiterCall(payload.payload.call);
    }
  });

  // 4. Listen for Dismissed Waiter Calls
  activeChannel.on('broadcast', { event: 'DISMISS_WAITER_CALL' }, (payload) => {
    if (payload?.payload?.callId && callbacks.onDismissWaiterCall) {
      callbacks.onDismissWaiterCall(payload.payload.callId);
    }
  });

  // 5. Listen for Menu or Settings updates
  activeChannel.on('broadcast', { event: 'TENANT_UPDATE' }, (payload) => {
    if (payload?.payload?.tenant && callbacks.onTenantUpdate) {
      callbacks.onTenantUpdate(payload.payload.tenant);
    }
  });

  activeChannel.subscribe((status) => {
    // Channel subscription state
    if (status === 'SUBSCRIBED') {
      // Connected to Realtime
    }
  });

  return () => {
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
  };
}

/**
 * Broadcast an order to all active devices (Kitchen, POS, Admin)
 */
export async function broadcastOrder(order: CustomerOrder) {
  if (activeChannel) {
    await activeChannel.send({
      type: 'broadcast',
      event: 'NEW_ORDER',
      payload: { order },
    });
  }

  // Attempt database persistence in Supabase table 'orders'
  try {
    await supabase.from('orders').upsert({
      id: order.id,
      kot_number: order.kotNumber,
      tenant_id: order.tenantId,
      table_number: order.tableNumber,
      order_type: order.orderType,
      items: order.items,
      total_amount: order.total,
      currency: 'LKR',
      status: order.status,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      created_at: order.createdAt || new Date().toISOString(),
    });
  } catch {
    // If table not yet migrated, broadcast handles real-time sync across open tabs/devices
  }
}

/**
 * Broadcast an order status update across all screens
 */
export async function broadcastOrderStatus(orderId: string, status: CustomerOrder['status']) {
  if (activeChannel) {
    await activeChannel.send({
      type: 'broadcast',
      event: 'ORDER_STATUS_UPDATE',
      payload: { orderId, status },
    });
  }

  try {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  } catch {
    // Fallback if table not yet created
  }
}

/**
 * Broadcast a waiter assistance call
 */
export async function broadcastWaiterCall(call: WaiterRequest) {
  if (activeChannel) {
    await activeChannel.send({
      type: 'broadcast',
      event: 'WAITER_CALL',
      payload: { call },
    });
  }

  try {
    await supabase.from('waiter_calls').insert({
      id: call.id,
      table_number: call.tableNumber,
      type: call.type,
      status: call.status,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Fallback
  }
}

/**
 * Broadcast dismiss waiter call
 */
export async function broadcastDismissWaiterCall(callId: string) {
  if (activeChannel) {
    await activeChannel.send({
      type: 'broadcast',
      event: 'DISMISS_WAITER_CALL',
      payload: { callId },
    });
  }

  try {
    await supabase.from('waiter_calls').update({ status: 'ATTENDED' }).eq('id', callId);
  } catch {
    // Fallback
  }
}

/**
 * Broadcast tenant menu or pricing changes
 */
export async function broadcastTenantUpdate(tenant: Tenant) {
  if (activeChannel) {
    await activeChannel.send({
      type: 'broadcast',
      event: 'TENANT_UPDATE',
      payload: { tenant },
    });
  }
}

/**
 * SQL Schema migration for Supabase to create real tables with 1 click
 */
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ==============================================================================
-- CEYTEQ DIGITAL RACE - COMPLETE DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- Run this script in your Supabase SQL Editor (1-Click Execution)
-- ==============================================================================

-- 1. Create Restaurants / Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'ACTIVE',
  plan TEXT DEFAULT 'PRO',
  currency TEXT DEFAULT 'LKR',
  table_count INTEGER DEFAULT 15,
  accent_color TEXT DEFAULT '#e11d48',
  logo_url TEXT,
  cover_image_url TEXT,
  categories JSONB DEFAULT '[]'::jsonb,
  products JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_number INTEGER,
  order_type TEXT DEFAULT 'DINE_IN',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'LKR',
  status TEXT DEFAULT 'PENDING',
  payment_method TEXT DEFAULT 'CASH',
  payment_status TEXT DEFAULT 'UNPAID',
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Waiter Calls Table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  table_number INTEGER NOT NULL,
  type TEXT DEFAULT 'CALL_WAITER',
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Supabase Realtime Replication on Orders and Waiter Calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;

-- 5. Row Level Security (Open for applet operations)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for waiter_calls" ON public.waiter_calls FOR ALL USING (true) WITH CHECK (true);
`;
