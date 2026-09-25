# ☂️ CAFE UMBRELLA — ELLA
## Digital Food Menu — Project Document 📄

> **Digital Race · InfoceyTQ** — 1st Customer Deployment
> 📅 2026-09-25 · GitHub PR: [#6](https://github.com/infoceyteq-maker/maker-digitalracemanagementpanel/pull/6)
> 📦 Package: `cafe-umbrella-website.zip` (4.2 MB · website එක විතරයි)

---

## 1 · 📌 Project Summary

| | |
|---|---|
| **Project Name** | Cafe Umbrella — Ella · Digital Food Menu |
| **Type** | Mobile-first PWA-style web app (QR scan → menu → order) |
| **Purpose** | QR code එකක් scan කරපු ගමන් කස්ටමර්ට premium digital menu එක පේනවා → dish තෝරලා contact details දීලා order කරනවා → order එක kitchen/WhatsApp එකට යනවා |
| **Tech Stack** | Next.js 15 (App Router) · React 19 · Framer Motion 12 · Tailwind CSS v4 · TypeScript · Canvas particle engine |
| **Design** | Ultra-premium dark mode (#0a0a0a) + red-yellow fire theme (#ff3b47 · #ff6a2e · #ffc93d) + teal brand logo |
| **Language** | English UI (brand voice) |
| **Performance** | Transform/opacity-only animations · lazy images (WebP) · self-hosted fonts · DPR-capped canvas · `prefers-reduced-motion` support |

---

## 2 · 🏪 Brand Details (menu එකේ පේන ඔක්කොම)

| | |
|---|---|
| **Business** | Cafe Umbrella (Roti & Kottu Hub) |
| **City** | Ella, Uva Province |
| **Address** | Passara Road 3rd Mile, Ella, Uva Province 90900 |
| **Phone / WhatsApp** | +94 71 205 4801 |
| **Google Maps** | https://share.google/cYiIixkUGF5D3pMt7 |
| **Facebook** | facebook.com/profile.php?id=61573828236464 |
| **Instagram** | instagram.com/cafe_umbrella_ |
| **Opening Hours** | 8:00 — 23:00 |
| **Rating** | 4.9 ★ · 1.2k reviews |
| **Logo** | Teal oval "umbrella ART CAFE" badge (transparent PNG — header/footer/app icon) |
| **Cover** | Nine Arch Bridge + sunset mountains painting banner |

---

## 3 · ✨ Features (හදපු ඔක්කොම)

### 🔥 Splash Screen (පළමු පිටවීම)
- QR "SCAN · CRAVE · ORDER" frame + scanning laser (1s)
- **Real wood fire** — canvas particles: flames + yellow cores + twinkle embers + crossed logs (මැද)
- Fire light එකෙන් brand text reveal: "THE UMBRELLA ELLA · ROTI & KOTTU HUB · Experience the taste of mountains!"
- Hold → **menu එකට smooth scale-down + fade** (menu එක පිටිපස්සේ pre-load වෙනවා = instant)
- SKIP button · reduced-motion එකේ 2s විතරයි

### 🍽️ Menu Page
- Cover banner (location pin chip + NOW OPEN chip → Google Maps)
- Brand strip: **punchi gini muduna** 🔥 (mini canvas fire) + name + address (Maps link) + FB/IG buttons + **animated WhatsApp chip** (+94 71 205 4801)
- Hero: rating chip + hours + location chip
- Sticky header: **84×54px logo** (top-left, scroll කළාම හැම page එකකම පේනවා) + cart button (badge count)
- Sticky category pills (Soup · Stews · Main Dish · Signature Roti · Kottu Junction) — auto-highlight scroll එකට
- **5 sections** — හැම එකකටම 🔥 flame icon + red-yellow fire gradient bar
- **3D dish cards**: pointer tilt + inner-image depth glide + idle float (කෑම floating වගේ) + scroll stagger + live **steam** 💨
- Cards: photo · badge (SIGNATURE/BESTSELLER/…) · name · description · **fire-gradient price** · time · spice flames · quick-add (＋)

### 📄 Product Detail (full-screen morph)
- Card එකෙන් full-screen එකට **morph** (shared-layout animation)
- 3D image pop + idle sway/float + large steam
- Glowing name + price + fire divider
- Chips: 🕒 prep time · 👥 serves · 🌶️ spice level
- **Bouncing/pulsing SPECIAL OFFER tag** (glow animation)
- INGREDIENTS chips (stagger reveal)
- Sticky glowing **ORDER NOW · Rs. X** button (sheen sweep animation)

### 🛒 Order Flow
- Cart bottom-sheet: items + qty steppers + thumbnails
- **YOUR DETAILS** form — Name (optional) + Mobile + Email
  - **Mobile හෝ Email අනිවාර්යයි** (හිස් නම් red error)
  - Sri Lankan mobile format + email validation
  - Details save වෙනවා (ඊළඟ පාර auto-prefill)
- **CLOSE BILL** → **Thank You screen** 🙏
  - Personalized ("Nimal, your order is in the kitchen queue…")
  - **ORDER KOT-1002** — kitchen panel එකෙන් එන real number
  - 🟢 "Sent to the kitchen panel ✓" / panel offline නම් WhatsApp fallback prompt
  - **SEND ORDER VIA WHATSAPP** — order summary එක (+94 71 205 4801) ට pre-filled
- Floating animated WhatsApp bubble (side එකෙන්, dish open වෙද්දි auto-hide)

### 🔗 Kitchen Integration
- `POST /api/orders` (menu app route) → **Restaurant Admin panel** `POST /api/public/orders`
- Server-side **re-pricing** (anti-tamper) → **KOT ticket** (KOT-1001, 1002…)
- Panel offline නම්: WhatsApp fallback — order කවදාවත් block වෙන්නේ නෑ
- Config: `.env` → `PANEL_API_URL=http://localhost:3001`

---

## 4 · 🍽️ Menu (dishes 12)

### Soup
| Dish | Price | Notes |
|---|---|---|
| Golden Pumpkin Velouté | Rs. 750 | 🥬 Veg · NEW |
| Clear Chicken Herb Soup | Rs. 850 | |

### Stews
| Dish | Price | Notes |
|---|---|---|
| Creamy Ceylon Chicken Stew | Rs. 1,400 | BESTSELLER |
| Devilled Beef Hot Pot | Rs. 1,750 | 🌶️ Hot · Free papadam offer |

### Main Dish
| Dish | Price | Notes |
|---|---|---|
| Ella Mountain Chicken Curry & Rice | Rs. 1,650 | CHEF'S PICK |
| Fire Wok Nasi Goreng | Rs. 1,500 | |

### Signature Roti
| Dish | Price | Notes |
|---|---|---|
| Umbrella Signature Chicken Roti | Rs. 850 | BESTSELLER · Buy 3 get 4th free |
| Island Pol Roti & Lunu Miris | Rs. 450 | 🥬 Veg |

### Kottu Junction
| Dish | Price | Notes |
|---|---|---|
| **Umbrella Ultimate Legend Kottu** | **Rs. 1,900** | ⭐ SIGNATURE · Free iced coffee + cashew salad |
| Chicken Cheese Blast Kottu | Rs. 1,550 | BESTSELLER |
| Midnight Egg & Cheese Kottu | Rs. 1,350 | |
| Ella Greens Veggie Kottu | Rs. 1,150 | 🥬 Veg |

> හැම dish එකකටම: ingredients list · prep time · serves · spice level · AI-generated photorealistic photo (`public/menu/*.jpg` — 12 photos)

---

## 5 · 📁 Project Structure

```
cafe-umbrella-menu/
├── app/
│   ├── api/orders/route.ts     ← orders → admin panel bridge
│   ├── globals.css             ← fire theme + animations (steam, glow, sheen…)
│   ├── layout.tsx · page.tsx
│   └── icon.png                ← app icon (teal umbrella badge)
├── components/
│   ├── Splash.tsx              ← fire + QR intro
│   ├── Bonfire.tsx             ← canvas fire (splash center)
│   ├── MenuExperience.tsx      ← main page orchestrator
│   ├── Header.tsx              ← 84×54 logo + cart
│   ├── BrandStrip.tsx          ← mini fire + address + social + WA
│   ├── MiniHearth.tsx          ← punchi gini (canvas)
│   ├── FoodCard.tsx            ← 3D parallax dish card
│   ├── ProductSheet.tsx        ← full-screen detail
│   ├── CartSheet.tsx           ← cart + contact + thank-you + KOT
│   ├── WhatsAppIcon.tsx · Toast.tsx · SmartImage.tsx · BrandLogo.tsx
├── lib/menu.ts                 ← හැම dish එකත් + BRAND + categories
├── public/menu/*.jpg (12) · public/brand/ (logo.png · cover.jpg)
├── START-HERE.md               ← සිංහල quick guide
└── package.json
```

---

## 6 · 💻 Run කරන හැටි

```bash
cd cafe-umbrella-menu
npm install
npm run dev          # → http://localhost:3000
```

**Panel එකට connect කරන්න (optional):**
```bash
# .env file:
PANEL_API_URL=http://localhost:3001
```

**Production / Deploy:**
```bash
npm run build && npm start        # own server
npx vercel                        # Vercel (free) — recommend
```

---

## 7 · 🎨 Customize කරන තැන්

| වෙනස් කරන්න | File |
|---|---|
| Dishes / prices / offers / ingredients | `lib/menu.ts` |
| Phone / address / hours / social links | `lib/menu.ts` → `BRAND` |
| පාට (red/yellow/fire) | `app/globals.css` → `@theme` block |
| Splash duration | `components/Splash.tsx` → `SPLASH_MS` |
| Logo / cover images | `public/brand/` |
| Dish photos | `public/menu/` |
| Panel URL (orders) | `.env` → `PANEL_API_URL` |

---

## 8 · 📊 Project Stats

| | |
|---|---|
| **Files** | ~30 source + 14 images |
| **Size (with images)** | ~4.2 MB (node_modules නැතුව) |
| **Dependencies** | 6 runtime (next, react, react-dom, framer-motion, lucide-react, fontsource fonts) |
| **Screens** | 4 main (Splash · Menu · Detail · Cart/Thank-you) |
| **Animations** | 15+ (fire, steam, morph, tilt, float, glow, bounce, sheen, pulse…) |
| **Tested** | Mobile 390×844 browser screenshots 8+ · end-to-end order → KOT verified |

---

## 9 · 🔗 Related

- **Backend (Admin Panel + Registration):** `cafe-umbrella-backend.zip` / repo root
- **Full System Handover:** `HANDOVER.md`
- **GitHub:** PR [#6](https://github.com/infoceyteq-maker/maker-digitalracemanagementpanel/pull/6) · branch `arena/01a0d280-maker-digitalracemanagementpan`
- **Screenshots:** workspace `ui-shots/` (1-splash-fire … 8-thankyou-kot)

---

*Powered by Digital Race · InfoceyTQ — Built with Arena.ai Agent Mode 💛*
