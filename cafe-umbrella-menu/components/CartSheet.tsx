'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, Minus, Phone, Plus, User, X } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { BRAND, formatLKR, MenuItem } from '@/lib/menu';

export interface CartLine {
  item: MenuItem;
  qty: number;
}

interface CartSheetProps {
  lines: CartLine[];
  onClose: () => void;
  onQty: (id: string, delta: number) => void;
  onCleared: () => void;
}

interface ContactForm {
  name: string;
  phone: string;
  email: string;
}

const LS_KEY = 'cu_contact';
const PHONE_RE = /^(\+?94|0)?7\d{8}$/; // Sri Lankan mobile
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function CartSheet({ lines, onClose, onQty, onCleared }: CartSheetProps) {
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState<ContactForm>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<ContactForm & { form: string }>>({});
  const [syncState, setSyncState] = useState<'syncing' | 'ok' | 'fail'>('syncing');
  const [kitchenOrderId, setKitchenOrderId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string>('');
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  // prefill from a previous order
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setForm(JSON.parse(saved) as ContactForm);
    } catch {
      /* noop */
    }
  }, []);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (form.name.trim() && form.name.trim().length < 3) e.name = 'Name looks too short';
    if (!form.phone.trim() && !form.email.trim()) {
      e.form = 'Mobile number or email is required — we send your order confirmation there.';
    }
    if (form.phone.trim() && !PHONE_RE.test(form.phone.replace(/[\s-]/g, ''))) {
      e.phone = 'Enter a valid Sri Lankan mobile (e.g. 071 205 4801)';
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      e.email = 'Enter a valid email address';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(form));
    } catch {
      /* noop */
    }
    setOrderRef(`CU-${String(Date.now()).slice(-4)}`);
    setPlaced(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([12, 50, 18]);

    // forward the order to the Restaurant Admin panel (best-effort)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ panelId: l.item.panelId, quantity: l.qty })),
          customer: { name: form.name, phone: form.phone, email: form.email },
        }),
      });
      const data = (await res.json().catch(() => null)) as { success?: boolean; kitchenOrderId?: string } | null;
      if (data?.success && data.kitchenOrderId) {
        setKitchenOrderId(data.kitchenOrderId);
        setSyncState('ok');
      } else {
        setSyncState('fail');
      }
    } catch {
      setSyncState('fail');
    }
  };

  const waOrderLink = () => {
    const itemLines = lines.map((l) => `• ${l.qty} × ${l.item.name} — ${formatLKR(l.item.price * l.qty)}`).join('\n');
    const msg = [
      `*NEW ORDER — Cafe Umbrella, Ella*`,
      ``,
      itemLines,
      ``,
      `*Total: ${formatLKR(total)}*`,
      ``,
      form.name.trim() ? `Name: ${form.name.trim()}` : '',
      form.phone.trim() ? `Mobile: ${form.phone.trim()}` : '',
      form.email.trim() ? `Email: ${form.email.trim()}` : '',
      ``,
      `Order #CU-${String(Date.now()).slice(-4)}`,
    ]
      .filter(Boolean)
      .join('\n');
    return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  const field =
    'w-full rounded-xl border bg-white/[0.04] px-3 py-2.5 text-[13px] font-medium text-cream placeholder:text-white/30 outline-none transition focus:border-flame/60 focus:bg-white/[0.06]';

  return (
    <motion.div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Your order">
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-2xl overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-flame/15 bg-coal pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-20px_80px_rgba(0,0,0,0.7)] sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:rounded-t-[28px]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className="px-5 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-white/15" />
          <div className="mt-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-cream">
              Your Order <span className="ml-1 text-[12px] font-bold text-sun">({count})</span>
            </h2>
            <button
              onClick={onClose}
              aria-label="Close order"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 active:scale-90"
            >
              <X size={16} />
            </button>
          </div>

          {placed ? (
            /* ── THANK YOU ─────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sun to-cherry text-[#2b060f] shadow-[0_0_44px_rgba(255,140,50,0.55)]"
              >
                <Check size={30} strokeWidth={3} />
              </motion.div>
              <h3 className="text-glow mt-4 font-display text-2xl font-extrabold text-cream">Thank You! 🙏</h3>
              <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/60">
                {form.name.trim() ? `${form.name.trim()}, your` : 'Your'} order is in the kitchen queue.
                {form.phone.trim()
                  ? ` We'll confirm it on ${form.phone.trim()}.`
                  : ` We'll confirm it at ${form.email.trim()}.`}
              </p>
              <p className="mt-4 rounded-full border border-sun/30 bg-sun/10 px-4 py-1.5 font-display text-sm font-extrabold tracking-widest text-sun">
                {kitchenOrderId ? `ORDER ${kitchenOrderId}` : `ORDER ${orderRef}`}
              </p>
              {/* kitchen sync status — order lands live in the Restaurant Admin panel */}
              <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold">
                {syncState === 'ok' && (
                  <span className="flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-green-300">
                    <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400" />
                    Sent to the kitchen panel ✓
                  </span>
                )}
                {syncState === 'syncing' && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/45">
                    Syncing with the kitchen…
                  </span>
                )}
                {syncState === 'fail' && (
                  <span className="rounded-full border border-sun/30 bg-sun/10 px-3 py-1 text-sun/85">
                    Kitchen panel offline — send via WhatsApp below 👇
                  </span>
                )}
              </p>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[11.5px] font-medium text-white/45">
                Total · <span className="flame-text font-bold">{formatLKR(total)}</span>
              </div>

              <a
                href={waOrderLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl bg-[#25d366] font-display text-[12.5px] font-extrabold tracking-[0.1em] text-white shadow-[0_8px_30px_rgba(37,211,102,0.4)] active:scale-95"
              >
                <WhatsAppIcon size={17} />
                SEND ORDER VIA WHATSAPP
              </a>
              <button
                onClick={onCleared}
                className="mt-3 h-12 w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 font-display text-[12px] font-extrabold tracking-[0.14em] text-white/70 active:scale-95"
              >
                BACK TO MENU
              </button>
            </motion.div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="text-4xl opacity-60">🛍️</span>
              <p className="mt-3 text-[13.5px] text-white/45">Your order is empty — tap any dish to start craving.</p>
            </div>
          ) : (
            <>
              {/* ── items ── */}
              <ul className="mt-3 divide-y divide-white/5">
                {lines.map(({ item, qty }) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[13px] font-bold text-cream">{item.name}</p>
                      <p className="mt-0.5 text-[12px] font-semibold text-flame">{formatLKR(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQty(item.id, -1)}
                        aria-label={`Remove one ${item.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 active:scale-90"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-4 text-center font-display text-[13px] font-extrabold text-cream">{qty}</span>
                      <button
                        onClick={() => onQty(item.id, 1)}
                        aria-label={`Add one ${item.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sun to-cherry text-[#2b060f] active:scale-90"
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>

              {/* ── customer contact (mandatory) ── */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-display text-[11px] font-extrabold tracking-[0.24em] text-sun/80">
                  YOUR DETAILS
                </p>
                <p className="mt-1 text-[11px] text-white/40">
                  We need your mobile number or email to send the order confirmation.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-white/50">
                      <User size={11} className="text-flame" /> NAME
                    </span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name (optional)"
                      autoComplete="name"
                      className={field}
                    />
                    {errors.name && <span className="mt-1 block text-[10.5px] font-semibold text-cherry">{errors.name}</span>}
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-white/50">
                      <Phone size={11} className="text-flame" /> MOBILE NUMBER
                    </span>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="07X XXX XXXX"
                      inputMode="tel"
                      autoComplete="tel"
                      className={field}
                    />
                    {errors.phone && <span className="mt-1 block text-[10.5px] font-semibold text-cherry">{errors.phone}</span>}
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-white/50">
                      <Mail size={11} className="text-flame" /> EMAIL
                    </span>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      className={field}
                    />
                    {errors.email && <span className="mt-1 block text-[10.5px] font-semibold text-cherry">{errors.email}</span>}
                  </label>
                </div>
                {errors.form && (
                  <p className="mt-3 rounded-lg border border-cherry/30 bg-cherry/10 px-3 py-2 text-[11.5px] font-semibold text-rose-200">
                    {errors.form}
                  </p>
                )}
              </div>

              {/* ── total + place order ── */}
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[12px] font-semibold tracking-wide text-white/45">TOTAL</span>
                <span className="flame-text font-display text-[22px] font-extrabold">{formatLKR(total)}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={placeOrder}
                className="order-btn mt-4 flex h-[54px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sun via-flame to-cherry font-display text-[14px] font-extrabold tracking-[0.14em] text-[#2b060f] shadow-[0_10px_40px_rgba(255,140,50,0.45)]"
              >
                CLOSE BILL · {formatLKR(total)}
              </motion.button>
              <p className="mt-3 pb-1 text-center text-[10.5px] text-white/30">
                Pay at the counter or by card when the food arrives. Demo experience.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
