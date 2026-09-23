export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO';

export type ThemePalette = 'PALETTE_1' | 'PALETTE_2' | 'PALETTE_3';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'MASTER_ADMIN' 
  | 'MANAGER' 
  | 'KITCHEN' 
  | 'FRONT' 
  | 'FINANCE' 
  | 'ADMIN' 
  | 'SUBADMIN' 
  | 'TENANT_OWNER' 
  | 'WAITER';

export type TenantPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export type DnsStatus = 'NOT_CONFIGURED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export type ProductApprovalStatus = 'PUBLISHED' | 'PENDING_APPROVAL' | 'DRAFT';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  showFacebook: boolean;
  showInstagram: boolean;
  showTiktok: boolean;
  showYoutube: boolean;
  showWhatsapp: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameSi?: string;
  description: string;
  descriptionSi?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  isHalal?: boolean;
  isGlutenFree?: boolean;
  preparationTime?: string;
  calories?: number;
  allergens?: string[];
  approvalStatus?: ProductApprovalStatus;
  draftedBy?: string;
}

export interface Category {
  id: string;
  name: string;
  nameSi?: string;
  iconName: string;
  order: number;
}

export interface DailyTrend {
  date: string;
  dayName: string;
  views: number;
  orders: number;
  revenue: number;
}

export interface CustomerOrder {
  id: string;
  kotNumber: string;
  tenantId: string;
  orderType: 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';
  tableNumber?: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  notes?: string;
  items: { product: Product; quantity: number; notes?: string }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'CARD' | 'CASH';
  paymentStatus: 'PAID' | 'PENDING';
  status: 'RECEIVED' | 'COOKING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  timeAgo?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverEtaMinutes?: number;
  deliveryStep?: 'ASSIGNED' | 'AT_RESTAURANT' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED';
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  status: TenantStatus;
  plan: TenantPlan;
  tier: SubscriptionTier;
  monthlyFee: number;
  createdAt: string;
  subdomain: string; // e.g. "ceylon-spice" -> ceylon-spice.ceyteq.com
  customDomain?: string; // e.g. "menu.ceylonspice.com"
  customDomainVerified: boolean;
  dnsStatus: DnsStatus;
  dnsExpectedCname: string; // e.g. "cname.ceyteq.com"
  logoUrl: string;
  coverImageUrl: string;
  accentColor: string;
  palette: ThemePalette;
  socialLinks: SocialLinks;
  phone: string;
  address: string;
  wifiSsid?: string;
  wifiPassword?: string;
  ownerPassword?: string;
  kitchenPin?: string;
  waiterPin?: string;
  currency: 'LKR' | 'USD' | 'EUR' | 'AED';
  tableCount: number;
  totalViews: number;
  totalOrders: number;
  deliveryEnabled: boolean;
  paymentGatewayEnabled: boolean;
  whatsappMessagingEnabled: boolean;
  hasAiChatbot?: boolean;
  aiChatbotConfig?: AiChatbotConfig;
  dailyTrends?: DailyTrend[];
  categories: Category[];
  products: Product[];
}

export interface AiChatbotConfig {
  enabled: boolean;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  whatsappVerifyToken?: string;
  autoReplyEnabled: boolean;
  botTone?: 'POLITE_CONCIERGE' | 'CASUAL_FRIENDLY' | 'FAST_ORDER_ASSISTANT';
  customInstructions?: string;
  welcomeMessage?: string;
  conversationsCount?: number;
  lastActiveTimestamp?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  source?: 'internal_panel' | 'whatsapp';
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface WaiterRequest {
  id: string;
  tableNumber: number;
  type: 'CALL_WAITER' | 'REQUEST_BILL' | 'WATER_REFILL' | 'CLEAN_TABLE';
  status: 'PENDING' | 'ATTENDED';
  timestamp: string;
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string;
  vehicleType: 'MOTORBIKE' | 'SCOOTER' | 'BICYCLE' | 'CAR';
  vehiclePlate: string;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE';
  rating: number;
  completedDeliveries: number;
  currentLat: number;
  currentLng: number;
  earningsToday: number;
  verified: boolean;
}

export interface TasteTripDeployment {
  id: string;
  tenantId: string;
  restaurantName: string;
  appName: string;
  bundleId: string;
  version: string;
  platform: 'IOS_AND_ANDROID';
  otaChannel: 'production' | 'staging';
  status: 'LIVE_STORES' | 'BUILD_IN_PROGRESS' | 'READY_TO_DEPLOY';
  lastBuildDate: string;
  appIconUrl: string;
  activeInstalls: number;
}

export type TasTripDeployment = TasteTripDeployment;

export type ActiveView = 
  | 'PUBLIC_MENU' 
  | 'CLIENT_DASHBOARD' 
  | 'PRO_OPERATIONS' 
  | 'SUPER_ADMIN' 
  | 'ANALYTICS' 
  | 'ARCHITECTURE' 
  | 'TASTE_TRIP'
  | 'TASTRIP_DASHBOARD'
  | 'SECURITY_CENTER';

export * from './types/security';

