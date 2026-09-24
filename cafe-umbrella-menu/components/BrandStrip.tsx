'use client';

import { Facebook, Instagram, MapPin } from 'lucide-react';
import MiniHearth from './MiniHearth';
import WhatsAppIcon from './WhatsAppIcon';
import { BRAND } from '@/lib/menu';

/**
 * Brand strip shown right below the cover banner:
 * mini wood-fire hearth (top-left) · name · address with Google Maps link ·
 * Facebook / Instagram logos · animated WhatsApp chip with the phone number.
 */
export default function BrandStrip() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-coal/70 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur">
      {/* left — mini hearth + name + address */}
      <div className="flex items-center gap-3">
        <MiniHearth />
        <div className="leading-tight">
          <p className="font-display text-[15px] font-extrabold tracking-wide text-cream">
            CAFE UMBRELLA <span className="flame-text">· ELLA</span>
          </p>
          <a
            href={BRAND.links.maps}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open location in Google Maps"
            className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-white/55 transition hover:text-sun"
          >
            <MapPin size={11} className="shrink-0 text-flame" />
            {BRAND.address}
          </a>
        </div>
      </div>

      {/* right — social + whatsapp */}
      <div className="flex items-center gap-2">
        <a
          href={BRAND.links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cafe Umbrella on Facebook"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-[#1877f2]/50 hover:text-[#4d9bff] active:scale-90"
        >
          <Facebook size={15} />
        </a>
        <a
          href={BRAND.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cafe Umbrella on Instagram"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-[#e1306c]/50 hover:text-[#ff5f8f] active:scale-90"
        >
          <Instagram size={15} />
        </a>
        <a
          href={`https://wa.me/${BRAND.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with us on WhatsApp — ${BRAND.phone}`}
          className="flex h-9 items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 text-green-300 shadow-[0_0_16px_rgba(37,211,102,0.18)] transition active:scale-95"
        >
          <span className="wa-pulse">
            <WhatsAppIcon size={15} />
          </span>
          <span className="text-[11.5px] font-bold tracking-wide">{BRAND.phone}</span>
        </a>
      </div>
    </div>
  );
}
