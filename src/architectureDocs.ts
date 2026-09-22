export const PRISMA_SCHEMA_CODE = `// prisma/schema.prisma
// Multi-Tenant Digital QR Menu SaaS ("Digital Race" by Ceyteq)

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  SUPER_ADMIN     // Ceyteq agency admins
  TENANT_OWNER    // Restaurant/hotel owner
  TENANT_MANAGER  // Chef / floor manager
  STAFF_WAITER    // Wait staff receiving table pings
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
}

enum SubscriptionPlan {
  STARTER         // $29/mo (up to 15 tables, subdomain only)
  PRO             // $69/mo (up to 40 tables, custom domain, analytics)
  ENTERPRISE      // $149/mo (unlimited tables, custom domain, multi-branch)
}

enum DnsStatus {
  NOT_CONFIGURED
  PENDING
  VERIFIED
  FAILED
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  passwordHash  String
  role          UserRole     @default(TENANT_OWNER)
  tenantId      String?      // Null for Ceyteq SUPER_ADMIN
  tenant        Tenant?      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([tenantId])
}

model Tenant {
  id                    String            @id @default(cuid())
  name                  String            // e.g. "Ceylon Spice Bistro"
  slug                  String            @unique // e.g. "ceylon-spice" -> ceylon-spice.ceyteq.com
  status                TenantStatus      @default(ACTIVE)
  plan                  SubscriptionPlan  @default(STARTER)
  
  // Custom Domain Mapping
  customDomain          String?           @unique // e.g. "menu.ceylonspice.com"
  customDomainVerified  Boolean           @default(false)
  dnsStatus             DnsStatus         @default(NOT_CONFIGURED)
  dnsExpectedCname      String            @default("cname.ceyteq.com")
  sslCertIssued         Boolean           @default(false)

  // Branding & Configuration
  logoUrl               String?
  coverImageUrl         String?
  accentColor           String            @default("#e11d48")
  currency              String            @default("LKR")
  locale                String            @default("en") // 'en' or 'si'
  phone                 String?
  address               String?
  wifiSsid              String?
  wifiPassword          String?

  // Relations
  users                 User[]
  domains               Domain[]
  menus                 Menu[]
  tables                Table[]
  orders                Order[]
  waiterCalls           WaiterCall[]
  subscriptions         Subscription[]
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  @@index([slug])
  @@index([customDomain])
}

model Domain {
  id            String     @id @default(cuid())
  tenantId      String
  tenant        Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  domain        String     @unique // e.g., "menu.restaurant.com"
  verified      Boolean    @default(false)
  verificationToken String? // TXT record or DNS token
  sslStatus     String     @default("pending")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([tenantId])
}

model Menu {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String      @default("Main Dining Menu")
  isActive    Boolean     @default(true)
  categories  Category[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([tenantId])
}

model Category {
  id          String      @id @default(cuid())
  menuId      String
  menu        Menu        @relation(fields: [menuId], references: [id], onDelete: Cascade)
  name        String      // English name e.g. "Seafood Specials"
  nameSi      String?     // Sinhala translation e.g. "මුහුදු ආහාර"
  iconName    String      @default("Utensils")
  sortOrder   Int         @default(0)
  isHidden    Boolean     @default(false)
  products    Product[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([menuId])
}

model Product {
  id              String      @id @default(cuid())
  categoryId      String
  category        Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name            String
  nameSi          String?
  description     String
  descriptionSi   String?
  price           Decimal     @db.Decimal(10, 2)
  originalPrice   Decimal?    @db.Decimal(10, 2)
  currency        String      @default("LKR")
  imageUrl        String
  isAvailable     Boolean     @default(true)
  isSpicy         Boolean     @default(false)
  isVegetarian    Boolean     @default(false)
  isHalal         Boolean     @default(false)
  isGlutenFree    Boolean     @default(false)
  preparationTime String?     // e.g. "15 mins"
  allergens       String[]    // e.g. ["Crustaceans", "Dairy"]
  orderItems      OrderItem[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([categoryId])
}

model Table {
  id          String        @id @default(cuid())
  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tableNumber Int           // e.g. Table 4
  sectionName String?       // e.g. "Patio", "VIP Lounge", "Ground Floor"
  qrCodeUrl   String?
  orders      Order[]
  waiterCalls WaiterCall[]
  createdAt   DateTime      @default(now())

  @@unique([tenantId, tableNumber])
  @@index([tenantId])
}

model Order {
  id          String        @id @default(cuid())
  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id])
  tableId     String
  table       Table         @relation(fields: [tableId], references: [id])
  totalAmount Decimal       @db.Decimal(10, 2)
  currency    String        @default("LKR")
  status      String        @default("PENDING") // PENDING, PREPARING, SERVED, PAID, CANCELLED
  items       OrderItem[]
  notes       String?
  createdAt   DateTime      @default(now())

  @@index([tenantId])
  @@index([tableId])
}

model OrderItem {
  id          String    @id @default(cuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(10, 2)
  notes       String?
}

model WaiterCall {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tableId     String
  table       Table     @relation(fields: [tableId], references: [id], onDelete: Cascade)
  type        String    // CALL_WAITER, REQUEST_BILL, WATER_REFILL
  status      String    @default("PENDING") // PENDING, ATTENDED
  createdAt   DateTime  @default(now())

  @@index([tenantId])
}

model Subscription {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan            SubscriptionPlan
  monthlyFee      Decimal           @db.Decimal(10, 2)
  isActive        Boolean           @default(true)
  startDate       DateTime          @default(now())
  renewDate       DateTime
  stripeSubId     String?
  createdAt       DateTime          @default(now())

  @@index([tenantId])
}
`;

export const NEXTJS_MIDDLEWARE_CODE = `// middleware.ts
// Next.js (App Router) Dynamic Subdomain & Custom Domain Routing
// Platform: Digital Race by Ceyteq

import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder images/assets
     * - api routes (unless subdomain specific)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|images/|api/auth).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // 1. Strip development ports (e.g. "ceylon.ceyteq.com:3000" -> "ceylon.ceyteq.com")
  const cleanHost = hostname.replace(/:\d+$/, "").toLowerCase();

  // 2. Define your primary domain & admin subdomain
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ceyteq.com";
  const ADMIN_SUBDOMAIN = \`admin.\${ROOT_DOMAIN}\`;

  // 3. Prevent rewriting on internal Next.js assets
  if (url.pathname.startsWith("/_next") || url.pathname.includes(".")) {
    return NextResponse.next();
  }

  // CASE A: Super Admin Panel (admin.ceyteq.com or localhost:3000/admin)
  if (cleanHost === ADMIN_SUBDOMAIN || (cleanHost === "localhost" && url.pathname.startsWith("/admin"))) {
    // Route to app/(admin)/...
    return NextResponse.rewrite(new URL(\`/admin\${url.pathname === "/admin" ? "" : url.pathname}\`, req.url));
  }

  // CASE B: Tenant Owner Web Dashboard (dashboard.ceyteq.com or /dashboard path)
  if (cleanHost === \`dashboard.\${ROOT_DOMAIN}\` || url.pathname.startsWith("/dashboard")) {
    return NextResponse.rewrite(new URL(\`/dashboard\${url.pathname.replace("/dashboard", "")}\`, req.url));
  }

  // CASE C: Main Agency Landing & Marketing (ceyteq.com or www.ceyteq.com or plain localhost)
  if (cleanHost === ROOT_DOMAIN || cleanHost === \`www.\${ROOT_DOMAIN}\` || cleanHost === "localhost") {
    return NextResponse.next(); // Serves app/(marketing)/page.tsx
  }

  // CASE D: Subdomain resolution (e.g. "ceylon-spice.ceyteq.com")
  let tenantIdentifier: string | null = null;
  let isCustomDomain = false;

  if (cleanHost.endsWith(\`.\${ROOT_DOMAIN}\`)) {
    // Extract subdomain e.g. "ceylon-spice"
    tenantIdentifier = cleanHost.replace(\`.\${ROOT_DOMAIN}\`, "");
  } else {
    // CASE E: Custom Domain resolution (e.g. "menu.theoceanrestaurant.lk")
    tenantIdentifier = cleanHost;
    isCustomDomain = true;
  }

  // Inject tenant context into request headers for Server Components & Cache keys
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-identifier", tenantIdentifier);
  requestHeaders.set("x-is-custom-domain", isCustomDomain ? "1" : "0");
  requestHeaders.set("x-original-host", cleanHost);

  // Rewrite to dynamic route group: app/[domain]/...
  // Example: "ceylon-spice.ceyteq.com/table/4" -> "/[domain]/ceylon-spice/table/4"
  // Example: "menu.ceylonspice.com/" -> "/[domain]/menu.ceylonspice.com"
  const rewriteUrl = new URL(\`/[domain]/\${tenantIdentifier}\${url.pathname}\`, req.url);

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}
`;

export const FOLDER_STRUCTURE_TEXT = `my-digital-race-app/
├── app/
│   ├── (marketing)/                # Public agency website (ceyteq.com)
│   │   ├── layout.tsx
│   │   └── page.tsx                # Marketing landing, pricing, demo request
│   │
│   ├── (admin)/                    # Super Admin (admin.ceyteq.com)
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Master sidebar (Ceyteq branding)
│   │   │   ├── page.tsx            # Agency Analytics, MRR, Server load
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx        # Tenant management & provision new client
│   │   │   │   └── [id]/page.tsx   # Detailed tenant audit & subscription override
│   │   │   └── domains/
│   │   │       └── page.tsx        # SSL & DNS CNAME mapping verification queue
│   │
│   ├── (dashboard)/                # Tenant Restaurant Owner Panel (dashboard.ceyteq.com)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Restaurant dashboard layout (dark/light)
│   │   │   ├── page.tsx            # Live orders, daily menu views & scan counts
│   │   │   ├── menu/
│   │   │   │   ├── page.tsx        # Food items, inline price updates, in-stock switches
│   │   │   │   └── categories/page.tsx # Category organizer (EN / Sinhala)
│   │   │   ├── qr-studio/
│   │   │   │   └── page.tsx        # High-res SVG/PNG QR generator with custom logo
│   │   │   ├── waiter-calls/
│   │   │   │   └── page.tsx        # Real-time audio chime for table assistance
│   │   │   └── settings/
│   │   │       ├── branding/page.tsx # Logo, cover image, theme accent color
│   │   │       └── domain/page.tsx   # Subdomain & Custom CNAME DNS mapping tools
│   │
│   ├── [domain]/                   # Dynamic Tenant Resolver (Subdomains & Custom Domains)
│   │   └── [tenantId]/
│   │       ├── layout.tsx          # Injects restaurant metadata, favicon, theme CSS
│   │       ├── page.tsx            # Mobile-First Digital QR Menu (Customer View)
│   │       ├── table/
│   │       │   └── [tableNumber]/page.tsx # Direct QR scan landing with table #
│   │       └── item/
│   │           └── [productId]/page.tsx   # Shareable dish details & allergens
│   │
│   └── api/
│       ├── domains/
│       │   ├── verify/route.ts     # Live DNS query resolver (evaluates CNAME)
│       │   └── sync-vercel/route.ts # Vercel Domains / Cloudflare for SaaS API
│       ├── waiter/
│       │   └── call/route.ts       # Table waiter call trigger
│       └── webhooks/
│           └── stripe/route.ts     # Agency subscription recurring billing
│
├── lib/
│   ├── prisma.ts                   # Cached Prisma Client instance
│   ├── edge-cache.ts               # Upstash Redis / Vercel Edge Config for domain mapping
│   ├── dns-check.ts                # Node.js 'dns/promises' resolveCname utility
│   └── formatters.ts               # Currency (LKR/USD) & Sinhala text helpers
│
├── components/
│   ├── ui/                         # shadcn/ui primitives (dialog, sheet, button, switch)
│   ├── menu/                       # Mobile-first customer menu components
│   └── dashboard/                  # Restaurant management components
│
├── middleware.ts                   # Edge routing logic for subdomains & custom domains
└── prisma/
    └── schema.prisma               # Multi-tenant relational schema
`;

export const CUSTOM_DOMAIN_GUIDE = `## 🌐 Production Custom Domain Architecture for Ceyteq

### How Custom Domain Mapping Works:
1. **Restaurant Owner configures their domain**:
   - Client owns \`menu.ceylonspice.com\` (or root domain \`ceylonspice.com\`).
   - They go to **Restaurant Dashboard > Domain Settings**.
   - The system instructs them:
     - **Type**: \`CNAME\`
     - **Host / Name**: \`menu\`
     - **Points to (Value)**: \`cname.ceyteq.com\`
2. **Automated SSL Certificate & Cloudflare for SaaS / Vercel Domains**:
   - When the client submits the domain, your backend invokes the **Vercel Domains API** or **Cloudflare for SaaS Custom Hostnames API**.
   - Free auto-provisioned SSL (Let's Encrypt / DigiCert) is attached to their hostname.
3. **Next.js Edge Middleware Dynamic Lookup**:
   - When a customer visits \`menu.ceylonspice.com\`, the Next.js \`middleware.ts\` intercepts the request.
   - It reads the host header \`menu.ceylonspice.com\`.
   - Checks **Vercel Edge Config** or **Upstash Redis** (cache lookup takes ~2ms).
   - If cache miss, queries Prisma database: \`prisma.tenant.findUnique({ where: { customDomain } })\`.
   - Rewrites internally to \`/[domain]/ceylon-spice/\` without changing the URL in the customer's browser!
`;
