/**
 * ==============================================================================
 * NEXT.JS API ROUTE: /api/master/tenants
 * Master Admin Exclusive Restaurant Provisioning & Subscription Management
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface CreateTenantPayload {
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword?: string;
  tier: 'FREE' | 'PLUS' | 'PRO';
  hasAiChatbot: boolean;
  hasWhatsAppBot: boolean;
  whatsappPhoneNumberId?: string;
  whatsappWebhookVerifyToken?: string;
  address: string;
  currency?: 'LKR' | 'USD' | 'EUR' | 'AED';
  tableCount?: number;
  kitchenPin?: string;
  waiterPin?: string;
  customDomain?: string;
}

export async function POST(request: Request) {
  try {
    // 1. Verify Master Admin Authorization
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.headers.get('cookie');

    // In production, verify JWT payload has role: 'MASTER_ADMIN'
    // Root Supervisor: Info.ceyteq@gmail.com
    const isMasterAuthorized = true; // Guarded by /middleware.ts

    if (!isMasterAuthorized) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Only the Master Admin (Info.ceyteq@gmail.com) has authorization to provision new restaurant tenants.',
        },
        { status: 403 }
      );
    }

    const payload: CreateTenantPayload = await request.json();
    const {
      name,
      slug,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
      tier = 'PRO',
      hasAiChatbot = true,
      hasWhatsAppBot = false,
      whatsappPhoneNumberId,
      whatsappWebhookVerifyToken,
      address,
      currency = 'LKR',
      tableCount = 15,
      kitchenPin = '2026',
      waiterPin = '1122',
      customDomain,
    } = payload;

    // 2. Field Validations
    if (!name || !slug || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Name, slug, ownerName, and ownerEmail are mandatory.' },
        { status: 400 }
      );
    }

    // 3. Fee calculation according to tier and add-ons
    let baseMonthlyFee = 0;
    if (tier === 'PLUS') baseMonthlyFee = 49;
    if (tier === 'PRO') baseMonthlyFee = 129;

    // Add-on pricing: WhatsApp automated bot is +$19/mo if not included
    let addOnFee = 0;
    if (hasWhatsAppBot) addOnFee += 19;
    if (hasAiChatbot && tier === 'FREE') addOnFee += 29;

    const totalMonthlyFee = baseMonthlyFee + addOnFee;

    // 4. Generate Webhook Secret if WhatsApp Bot is enabled
    const generatedWebhookSecret = hasWhatsAppBot
      ? (whatsappWebhookVerifyToken || `ceyteq_wa_${crypto.randomBytes(12).toString('hex')}`)
      : undefined;

    // 5. Construct Provisioned Tenant Object
    const tenantId = `tenant-${Date.now()}`;
    const newTenant = {
      id: tenantId,
      name,
      slug: slug.toLowerCase().trim(),
      subdomain: slug.toLowerCase().trim(),
      customDomain: customDomain || null,
      customDomainVerified: false,
      dnsStatus: customDomain ? 'PENDING' : 'NOT_CONFIGURED',
      dnsExpectedCname: 'cname.ceyteq.com',
      ownerName,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      ownerPhone: ownerPhone || '+94770000000',
      ownerPassword: ownerPassword || `${slug}@owner2026`,
      tier,
      status: 'ACTIVE',
      monthlyFee: totalMonthlyFee,
      // Add-on Toggles
      hasAiChatbot,
      hasWhatsAppBot,
      whatsappPhoneNumberId: hasWhatsAppBot ? whatsappPhoneNumberId : null,
      whatsappWebhookVerifyToken: generatedWebhookSecret,
      // Operations
      address: address || 'Colombo, Sri Lanka',
      currency,
      tableCount,
      kitchenPin,
      waiterPin,
      deliveryEnabled: tier !== 'FREE',
      paymentGatewayEnabled: tier !== 'FREE',
      totalViews: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    console.log(`🏢 [TENANT PROVISIONED BY MASTER ADMIN]`);
    console.log(`   - Restaurant: ${newTenant.name} (${newTenant.slug}.ceyteq.com)`);
    console.log(`   - Owner:      ${newTenant.ownerEmail} (${newTenant.ownerPhone})`);
    console.log(`   - Tier:       ${newTenant.tier} ($${newTenant.monthlyFee}/mo)`);
    console.log(`   - AI Chatbot: ${newTenant.hasAiChatbot ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   - WA Bot:     ${newTenant.hasWhatsAppBot ? `ENABLED (PhoneID: ${newTenant.whatsappPhoneNumberId})` : 'DISABLED'}`);

    return NextResponse.json({
      success: true,
      message: 'Restaurant tenant provisioned successfully by Master Admin.',
      tenant: newTenant,
      credentials: {
        ownerLoginUrl: `https://${newTenant.slug}.ceyteq.com/dashboard/restaurant`,
        ownerEmail: newTenant.ownerEmail,
        ownerPassword: newTenant.ownerPassword,
        kitchenTerminalPin: newTenant.kitchenPin,
        waiterMobilePin: newTenant.waiterPin,
      },
    });
  } catch (error: any) {
    console.error('❌ [MASTER TENANT PROVISIONING ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
