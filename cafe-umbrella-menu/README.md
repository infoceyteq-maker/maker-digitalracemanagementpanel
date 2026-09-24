# ☂️ Cafe Umbrella — Ella · Digital Menu

Ultra-premium, mobile-first digital food menu for **Cafe Umbrella, Ella (Sri Lanka)**.
Built with **Next.js 15 (App Router) + React 19 + Framer Motion + Tailwind CSS v4**.

![stack](https://img.shields.io/badge/Next.js-15-black) ![react](https://img.shields.io/badge/React-19-149eca) ![motion](https://img.shields.io/badge/Framer_Motion-12-ff2d4f)

## ✨ Experience

| Feature | Details |
| --- | --- |
| 🌫️ **Wood-fire hearth splash** | Canvas particle engine renders a natural wood-fire hearth — dancing cherry-red flames, glowing embers and fire-lit smoke rising from the bottom, a QR "scan" intro dissolves into the glowing logo reveal, holds, then fades & scales down into the menu grid |
| 🍽️ **4K-style food grid** | Photorealistic top-down flat lays (warm appetizing lighting) across Soup · Stews · Main Dish · Signature Roti · Kottu Junction |
| 💨 **Live steam VFX** | Pure-CSS GPU-only steam puffs rise from every hot dish — IntersectionObserver pauses them off-screen |
| 📐 **3D parallax cards** | Pointer-tracked tilt + scale with spring physics (hover devices) and a soft entrance stagger on scroll |
| 🌀 **Card → full-screen morph** | Framer Motion shared-layout (`layoutId`) morphs the tapped dish into a full-screen detail view with a 3D image pop |
| 🏷️ **Special offers** | Bouncing / pulsing glowing tag on featured dishes |
| 🛒 **Order flow** | Glowing sticky ORDER NOW bar, quick-add, cart sheet with qty controls & animated confirmation |
| ⚡ **Mobile-first performance** | transform/opacity-only animations, DPR-capped canvas (splash only), lazy images, `prefers-reduced-motion` respected, self-hosted variable fonts |

## 🔗 Kitchen integration (Restaurant Admin panel)

Orders placed at bill-close are forwarded live to the Digital Race **Restaurant Admin**
panel (`POST /api/public/orders`) and appear in the kitchen as KOT tickets.
Configure the panel base URL with `PANEL_API_URL` (default `http://127.0.0.1:3001`).
If the panel is offline the customer flow never breaks — the WhatsApp order handoff
is always available as a fallback.

Demo admin login: `thejanlahiru44@gmail.com` / `Umbrella@2026` (2FA demo code `482910`).

## 🚀 Run

```bash
cd cafe-umbrella-menu
npm install
npm run dev        # → http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

## 📁 Structure

```
cafe-umbrella-menu/
├── app/                # layout, page, globals (design tokens)
├── components/         # Splash, MenuExperience, FoodCard, ProductSheet,
│                       # CartSheet, SteamPuffs, Header, Toast, SmartImage
├── lib/menu.ts         # menu data (12 dishes · 5 categories)
└── public/menu/        # AI-generated photorealistic food photography
```

---
Powered by Digital Race · InfoceyTQ — first customer deployment: **Cafe Umbrella, Ella** 💛
