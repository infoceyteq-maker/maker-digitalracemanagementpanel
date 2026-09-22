/**
 * "Taste Trip" Ecosystem - Architecture Specifications & Production Boilerplates
 * Ceyteq Digital Race SaaS Platform
 */

export const MOBILE_APP_ARCHITECTURE_GUIDE = `
# Taste Trip Mobile App Architecture (React Native / Expo)
**Ecosystem**: Multi-Tenant Food Ordering & Fleet Delivery (Client + Driver in Unified Codebase)
**Agency**: Ceyteq Digital Race SaaS Platform

---

## 1. Recommended Tech Stack

| Layer | Recommended Technology | Why Chosen for Taste Trip |
|---|---|---|
| **Framework** | **Expo SDK 52+ / React Native 0.76+ (New Architecture)** | Turbomodules + Fabric engine for smooth 60fps gesture handling, maps, and instant OTA deployments. |
| **Routing** | **Expo Router v4 (File-based)** | Deep linking for QR tables (\`/table/[id]\`), push notification routing, and dynamic role-based routes (\`/(client)\` vs \`/(driver)\`). |
| **Styling** | **NativeWind v4 (Tailwind CSS)** | Shared styling paradigm with Next.js web dashboard; zero runtime overhead with React Native CSS engine. |
| **Maps & GPS** | **react-native-maps + expo-location + Mapbox** | Native Apple Maps / Google Maps rendering with background GPS tracking (\`TaskManager.defineTask\`) for rider location streaming. |
| **Real-Time Telemetry** | **Supabase Realtime / Pusher / WebSockets** | Sub-second vehicle coordinate broadcasting from Driver app to Customer tracker and Kitchen KOT. |
| **State & Data** | **TanStack Query (React Query) + Zustand** | Optimistic UI updates for order acceptance, offline menu caching, and transient cart state. |
| **Payments** | **@stripe/stripe-react-native / PayHere SDK** | Native Apple Pay, Google Pay, and saved cards with PCI-compliant payment sheets. |
| **Push Notifications** | **expo-notifications + FCM / APNs** | High-priority acoustic notifications for driver order radar and real-time delivery status updates. |
| **Build & Deploy** | **Expo Application Services (EAS)** | Automated white-label multi-tenant builds with custom Bundle IDs (\`com.ceyteq.tastetrip.[slug]\`) and OTA instant code push. |

---

## 2. Unified Codebase Strategy: Role-Based vs. Monorepo

We recommend an **Expo Router Role-Partitioned Monorepo Structure**.
Both apps share UI primitives, API types, and authentication services while compiling either into **distinct binaries** for app stores or a **single unified company app** with role-swapping.

\`\`\`
taste-trip-monorepo/
├── apps/
│   ├── mobile/                      # Expo Router Universal App
│   │   ├── app/
│   │   │   ├── _layout.tsx          # Root Auth Guard (Customer vs Driver)
│   │   │   ├── (auth)/              # Login, Driver Register, Phone OTP
│   │   │   │   ├── login.tsx
│   │   │   │   └── driver-kyc.tsx
│   │   │   ├── (client)/            # Customer Food Ordering & Tracker
│   │   │   │   ├── index.tsx        # Restaurant Menu & Category Carousel
│   │   │   │   ├── cart.tsx         # Delivery/Pickup & Card Checkout
│   │   │   │   └── track/[orderId].tsx # Live Map with Moving Rider Marker
│   │   │   └── (driver)/            # Courier Delivery Cockpit
│   │   │       ├── dashboard.tsx    # Online Toggle, Live Radar, Maps
│   │   │       ├── order/[id].tsx   # Navigation & Proof of Delivery
│   │   │       └── earnings.tsx     # Daily Pay & Trip History
│   │   ├── app.config.ts            # Dynamic White-Label Brand & Bundle ID
│   │   └── package.json
│   └── web/                         # Next.js 15 Ceyteq Master Platform
│       ├── app/
│       │   ├── admin/
│       │   │   ├── restaurants/     # Tenant & Tier Management
│       │   │   ├── tastetrip/       # EAS Deployments & Fleet Management
│       │   │   └── page.tsx
│       └── package.json
└── packages/
    ├── api/                         # tRPC / REST typed API client
    ├── types/                       # Shared TypeScript models (Order, Driver, Tenant)
    └── ui/                          # Shared Tailwind components (Buttons, Badges)
\`\`\`
`;

export const DRIVER_UI_REACT_NATIVE_BOILERPLATE = `// apps/mobile/app/(driver)/dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
  Dimensions,
  Image,
  Alert,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { 
  Navigation, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Clock, 
  DollarSign, 
  MapPin 
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface IncomingOrder {
  id: string;
  orderNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  distanceKm: number;
  earningsLkr: number;
  itemsCount: number;
  pickupCoords: { latitude: number; longitude: number };
  dropCoords: { latitude: number; longitude: number };
}

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [driverLocation, setDriverLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [incomingOrder, setIncomingOrder] = useState<IncomingOrder | null>(null);
  const [activeOrder, setActiveOrder] = useState<IncomingOrder | null>(null);
  const [deliveryStep, setDeliveryStep] = useState<'HEADING_TO_RESTAURANT' | 'PICKED_UP' | 'DELIVERED'>('HEADING_TO_RESTAURANT');
  const [countdown, setCountdown] = useState<number>(30);

  const mapRef = useRef<MapView>(null);

  // Request high-accuracy GPS on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required for delivery navigation.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setDriverLocation(loc.coords);

      // Subscribe to live GPS changes (Simulate rider motion)
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (position) => {
          setDriverLocation(position.coords);
        }
      );

      return () => watcher.remove();
    })();
  }, []);

  // Simulate incoming dispatch radar when online
  useEffect(() => {
    if (isOnline && !activeOrder && !incomingOrder) {
      const timer = setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIncomingOrder({
          id: 'ord-live-772',
          orderNumber: 'TT-#491',
          restaurantName: 'Ceylon Spice Bistro',
          restaurantAddress: '42 Galle Face Court, Colombo 03',
          customerName: 'Ayesha Jayawardena',
          customerPhone: '+94771234567',
          deliveryAddress: '15 Alfred House Gardens, Colombo 03',
          distanceKm: 2.8,
          earningsLkr: 650,
          itemsCount: 3,
          pickupCoords: { latitude: 6.9271, longitude: 79.8612 },
          dropCoords: { latitude: 6.9010, longitude: 79.8540 },
        });
        setCountdown(30);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, activeOrder, incomingOrder]);

  // Acceptance timer
  useEffect(() => {
    if (incomingOrder && countdown > 0) {
      const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(interval);
    } else if (countdown === 0 && incomingOrder) {
      setIncomingOrder(null);
    }
  }, [incomingOrder, countdown]);

  const handleToggleOnline = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOnline(val);
    if (!val) {
      setIncomingOrder(null);
    }
  };

  const handleAcceptOrder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveOrder(incomingOrder);
    setIncomingOrder(null);
    setDeliveryStep('HEADING_TO_RESTAURANT');
  };

  const handleRejectOrder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIncomingOrder(null);
  };

  const handleOpenTurnByTurnGPS = (lat: number, lng: number, label: string) => {
    const url = \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}&travelmode=driving\`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* 1. Live Native Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation?.latitude || 6.9271,
          longitude: driverLocation?.longitude || 79.8612,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        }}
      >
        {/* Driver Live Marker */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Your Bike Location"
          >
            <View style={styles.driverMarker}>
              <Text style={{ fontSize: 20 }}>🛵</Text>
            </View>
          </Marker>
        )}

        {/* Active Order Pickup & Dropoff Markers */}
        {activeOrder && (
          <>
            <Marker coordinate={activeOrder.pickupCoords} title="Pickup: Restaurant">
              <View style={[styles.pinBadge, { backgroundColor: '#e11d48' }]}>
                <Text style={styles.pinText}>🍽️</Text>
              </View>
            </Marker>
            <Marker coordinate={activeOrder.dropCoords} title="Dropoff: Customer">
              <View style={[styles.pinBadge, { backgroundColor: '#10b981' }]}>
                <Text style={styles.pinText}>🏠</Text>
              </View>
            </Marker>
            <Polyline
              coordinates={[
                driverLocation || activeOrder.pickupCoords,
                activeOrder.pickupCoords,
                activeOrder.dropCoords,
              ]}
              strokeColor="#e11d48"
              strokeWidth={4}
            />
          </>
        )}
      </MapView>

      {/* 2. Top Status Bar with Online Switch */}
      <View style={styles.topBar}>
        <View style={styles.driverProfile}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.driverName}>Suresh J. (WP BCD-4421)</Text>
            <Text style={styles.earningHeader}>Today: Rs. 6,850 • 9 Trips</Text>
          </View>
        </View>

        <View style={styles.onlineToggleRow}>
          <Text style={[styles.statusLabel, { color: isOnline ? '#10b981' : '#94a3b8' }]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#334155', true: '#059669' }}
            thumbColor={isOnline ? '#34d399' : '#cbd5e1'}
          />
        </View>
      </View>

      {/* 3. Active Order Execution Cockpit */}
      {activeOrder && (
        <View style={styles.activeOrderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumBadge}>{activeOrder.orderNumber}</Text>
              <Text style={styles.activeTitle}>{activeOrder.restaurantName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL(\`tel:\${activeOrder.customerPhone}\`)}
              style={styles.callButton}
            >
              <Phone size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationDetailRow}>
            <MapPin size={16} color="#e11d48" />
            <Text style={styles.locationText} numberOfLines={1}>
              {deliveryStep === 'HEADING_TO_RESTAURANT'
                ? activeOrder.restaurantAddress
                : activeOrder.deliveryAddress}
            </Text>
          </View>

          {/* Step Progression Buttons */}
          {deliveryStep === 'HEADING_TO_RESTAURANT' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => handleOpenTurnByTurnGPS(activeOrder.pickupCoords.latitude, activeOrder.pickupCoords.longitude, 'Restaurant')}
              >
                <Navigation size={16} color="#fff" />
                <Text style={styles.navButtonText}>Turn-by-Turn GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setDeliveryStep('PICKED_UP')}
              >
                <Text style={styles.confirmButtonText}>Confirm Picked Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {deliveryStep === 'PICKED_UP' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => handleOpenTurnByTurnGPS(activeOrder.dropCoords.latitude, activeOrder.dropCoords.longitude, 'Customer')}
              >
                <Navigation size={16} color="#fff" />
                <Text style={styles.navButtonText}>Route to Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: '#10b981' }]}
                onPress={() => {
                  Alert.alert('Delivery Complete!', 'Earnings credited: Rs. ' + activeOrder.earningsLkr);
                  setActiveOrder(null);
                }}
              >
                <Text style={styles.confirmButtonText}>Complete Delivery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 4. Incoming Dispatch Radar Bottom Modal */}
      <Modal visible={!!incomingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.timerRow}>
              <Text style={styles.radarTitle}>🚨 NEW DELIVERY OFFER</Text>
              <Text style={styles.countdownBadge}>{countdown}s</Text>
            </View>

            <Text style={styles.offerEarning}>Rs. {incomingOrder?.earningsLkr}</Text>
            <Text style={styles.offerDistance}>{incomingOrder?.distanceKm} km total trip • {incomingOrder?.itemsCount} food items</Text>

            <View style={styles.routeBox}>
              <Text style={styles.routePoint}>📍 Pickup: {incomingOrder?.restaurantName}</Text>
              <Text style={styles.routePoint}>🏠 Dropoff: {incomingOrder?.deliveryAddress}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectOrder}>
                <Text style={styles.rejectBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptOrder}>
                <Text style={styles.acceptBtnText}>ACCEPT ORDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  map: { width, height },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  driverProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  driverName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  earningHeader: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  onlineToggleRow: { alignItems: 'flex-end' },
  statusLabel: { fontSize: 10, fontWeight: '900', marginBottom: 4 },
  driverMarker: {
    backgroundColor: '#0f172a',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e11d48',
  },
  pinBadge: { padding: 6, borderRadius: 16, borderWidth: 1, borderColor: '#fff' },
  pinText: { fontSize: 16 },
  activeOrderCard: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumBadge: { color: '#e11d48', fontWeight: '800', fontSize: 12 },
  activeTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginTop: 2 },
  callButton: {
    backgroundColor: '#059669',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  locationText: { color: '#cbd5e1', fontSize: 13, flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  navButton: {
    flex: 1,
    backgroundColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  confirmButton: {
    flex: 1,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radarTitle: { color: '#e11d48', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  countdownBadge: {
    backgroundColor: '#be123c',
    color: '#fff',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  offerEarning: { color: '#fff', fontSize: 32, fontWeight: '900', marginVertical: 8 },
  offerDistance: { color: '#94a3b8', fontSize: 13, marginBottom: 16 },
  routeBox: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  routePoint: { color: '#e2e8f0', fontSize: 13 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  rejectBtnText: { color: '#94a3b8', fontWeight: 'bold' },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#e11d48',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
`;

export const CLIENT_UI_REACT_NATIVE_BOILERPLATE = `// apps/mobile/app/(client)/index.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { 
  ShoppingBag, 
  Bike, 
  Store, 
  Plus, 
  Minus, 
  CreditCard, 
  Check, 
  MapPin, 
  Clock 
} from 'lucide-react-native';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  isSpicy?: boolean;
}

const MOCK_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Ceylon Black Pepper Crab',
    price: 3800,
    description: 'Fresh lagoon mud crab wok-fried in ground Jaffna peppercorn.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    isSpicy: true,
  },
  {
    id: 'm2',
    name: 'Jaffna Mutton Curry & String Hoppers',
    price: 2400,
    description: 'Slow-simmered goat curry served with 10 steamed string hoppers & sodhi.',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
    isSpicy: true,
  },
  {
    id: 'm3',
    name: 'Tamarind Glazed Prawn Skewers',
    price: 2900,
    description: 'Grilled jumbo king prawns brushed with chili-tamarind reduction.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600',
  }
];

export default function TasteTripCustomerApp() {
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; qty: number } }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const addToCart = (item: MenuItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty || 0) + 1 }
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[id].qty > 1) {
        copy[id].qty -= 1;
      } else {
        delete copy[id];
      }
      return copy;
    });
  };

  const subtotal = Object.values(cart).reduce((sum, c) => sum + (c.item.price * c.qty), 0);
  const deliveryFee = orderType === 'DELIVERY' ? 350 : 0;
  const total = subtotal + deliveryFee;

  // Stripe Mobile Card Checkout Flow
  const handleCheckoutWithStripe = async () => {
    try {
      // 1. Fetch ClientSecret from Ceyteq Next.js backend
      // const res = await fetch('https://api.ceyteq.com/api/create-payment-intent', { method: 'POST' });
      // const { clientSecret } = await res.json();

      // Simulated Payment Process
      Alert.alert('Payment Successful', 'Rs. ' + total + ' charged to your Visa card. Order sent to kitchen!');
      setIsCheckoutOpen(false);
      setCart({});
      setIsTracking(true);
    } catch (err) {
      Alert.alert('Payment Error', 'Unable to complete transaction.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Taste Trip</Text>
          <Text style={styles.restaurantName}>Ceylon Spice Bistro</Text>
        </View>

        {/* Delivery / Pickup Switch */}
        <View style={styles.deliveryPill}>
          <TouchableOpacity
            style={[styles.pillBtn, orderType === 'DELIVERY' && styles.pillActive]}
            onPress={() => setOrderType('DELIVERY')}
          >
            <Bike size={14} color={orderType === 'DELIVERY' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.pillText, orderType === 'DELIVERY' && styles.pillTextActive]}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, orderType === 'PICKUP' && styles.pillActive]}
            onPress={() => setOrderType('PICKUP')}
          >
            <Store size={14} color={orderType === 'PICKUP' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.pillText, orderType === 'PICKUP' && styles.pillTextActive]}>Pickup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Catalog */}
      <ScrollView contentContainerStyle={styles.menuList}>
        {MOCK_ITEMS.map(item => {
          const inCart = cart[item.id]?.qty || 0;
          return (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>Rs. {item.price.toLocaleString()}</Text>
                  {inCart === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                      <Plus size={16} color="#fff" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.counterRow}>
                      <TouchableOpacity style={styles.countBtn} onPress={() => removeFromCart(item.id)}>
                        <Minus size={14} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.countText}>{inCart}</Text>
                      <TouchableOpacity style={styles.countBtn} onPress={() => addToCart(item)}>
                        <Plus size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Floating Cart Bar */}
      {subtotal > 0 && (
        <View style={styles.floatingCartBar}>
          <View>
            <Text style={styles.cartCountText}>{Object.values(cart).reduce((a, b) => a + b.qty, 0)} Items</Text>
            <Text style={styles.cartTotalText}>Rs. {total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => setIsCheckoutOpen(true)}>
            <ShoppingBag size={18} color="#fff" />
            <Text style={styles.viewCartText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Checkout Drawer Modal */}
      <Modal visible={isCheckoutOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.checkoutSheet}>
            <Text style={styles.sheetTitle}>Checkout & Payment</Text>
            <View style={styles.addressBox}>
              <MapPin size={18} color="#e11d48" />
              <View>
                <Text style={styles.addressTitle}>Delivering to Alfred House Gardens</Text>
                <Text style={styles.addressSub}>Est. 25-30 mins delivery time</Text>
              </View>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>Rs. {subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Courier Fee</Text>
                <Text style={styles.summaryVal}>Rs. {deliveryFee}</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: '#334155', paddingTop: 8 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#fff' }]}>Total</Text>
                <Text style={[styles.summaryVal, { fontWeight: '900', color: '#e11d48', fontSize: 18 }]}>
                  Rs. {total.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.payBtn} onPress={handleCheckoutWithStripe}>
              <CreditCard size={18} color="#fff" />
              <Text style={styles.payBtnText}>Pay with Card (Stripe)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCheckoutOpen(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  brandTitle: { color: '#e11d48', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  restaurantName: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  deliveryPill: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 20,
    padding: 3,
  },
  pillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pillActive: { backgroundColor: '#e11d48' },
  pillText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  menuList: { padding: 16, gap: 16, paddingBottom: 120 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 14 },
  dishName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dishDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  priceText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#020617', padding: 4, borderRadius: 12 },
  countBtn: { backgroundColor: '#e11d48', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  floatingCartBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cartCountText: { color: '#94a3b8', fontSize: 11 },
  cartTotalText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  viewCartBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewCartText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  checkoutSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  addressBox: { flexDirection: 'row', gap: 12, backgroundColor: '#020617', padding: 12, borderRadius: 12, marginBottom: 16 },
  addressTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  addressSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  summaryBox: { backgroundColor: '#020617', padding: 14, borderRadius: 14, gap: 8, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#94a3b8', fontSize: 13 },
  summaryVal: { color: '#fff', fontSize: 13, fontWeight: '600' },
  payBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  closeBtn: { alignItems: 'center', marginTop: 14 },
  closeBtnText: { color: '#94a3b8', fontSize: 13 },
});
`;

export const NEXTJS_CEYTEQ_MASTER_PANEL_BOILERPLATE = `// web/app/admin/tastetrip/page.tsx
/**
 * Ceyteq Digital Race - Master Agency Admin Dashboard
 * For Jasmine & Super Admins to manage Pro Client Mobile Deployments & Driver Fleet
 */
import React from 'react';
import { 
  Building2, 
  Smartphone, 
  Bike, 
  TrendingUp, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface RestaurantAppDeployment {
  id: string;
  tenantName: string;
  bundleId: string;
  version: string;
  tier: 'FREE' | 'PLUS' | 'PRO';
  status: 'LIVE_STORES' | 'BUILD_QUEUED' | 'READY_TO_DEPLOY';
  lastBuild: string;
  activeDrivers: number;
}

const DEPLOYMENTS: RestaurantAppDeployment[] = [
  {
    id: 'dep-1',
    tenantName: 'Ceylon Spice Bistro',
    bundleId: 'com.ceyteq.tastetrip.ceylonspice',
    version: '1.4.2',
    tier: 'PRO',
    status: 'LIVE_STORES',
    lastBuild: 'Sep 18, 2026',
    activeDrivers: 4,
  },
  {
    id: 'dep-2',
    tenantName: 'The Ocean Catch Club',
    bundleId: 'com.ceyteq.tastetrip.oceancatch',
    version: '1.2.0',
    tier: 'PRO',
    status: 'LIVE_STORES',
    lastBuild: 'Sep 15, 2026',
    activeDrivers: 3,
  },
  {
    id: 'dep-3',
    tenantName: 'Colombo Urban Roastery',
    bundleId: 'com.ceyteq.tastetrip.urbanroastery',
    version: '1.0.0-rc.1',
    tier: 'PRO',
    status: 'BUILD_QUEUED',
    lastBuild: 'Pending EAS trigger',
    activeDrivers: 0,
  }
];

export default function CeyteqTasteTripMasterDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Ceyteq Agency Master Level</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Taste Trip Pro Mobile Ecosystem</h1>
          <p className="text-sm text-slate-400 mt-1">
            Control white-label Expo builds, EAS OTA updates, and Central Delivery Driver fleet for Pro clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700">
            Export Driver Telemetry
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50">
            <Plus className="w-4 h-4" />
            <span>Provision Pro Mobile App</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Pro Deployed Apps</span>
          <p className="text-2xl font-black text-white mt-2">12 Live</p>
          <span className="text-xs text-emerald-400 font-semibold">100% EAS Store Uptime</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Registered Delivery Riders</span>
          <p className="text-2xl font-black text-white mt-2">48 Riders</p>
          <span className="text-xs text-cyan-400 font-semibold">32 On Trips Right Now</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Today's Delivery Volume</span>
          <p className="text-2xl font-black text-white mt-2">Rs. 1,480,200</p>
          <span className="text-xs text-rose-400 font-semibold">284 Completed Deliveries</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Avg Delivery Speed</span>
          <p className="text-2xl font-black text-white mt-2">24.6 Mins</p>
          <span className="text-xs text-emerald-400 font-semibold">Colombo Metro Coverage</span>
        </div>
      </div>

      {/* Section 1: Taste Trip Pro Deployments */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-500" />
              <span>Taste Trip App Deployments (Pro Option Subscribers)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Custom iOS & Android packages generated via Expo Application Services (EAS).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Restaurant Client</th>
                <th className="pb-3 font-semibold">Bundle Identifier</th>
                <th className="pb-3 font-semibold">Version</th>
                <th className="pb-3 font-semibold">Fleet Assigned</th>
                <th className="pb-3 font-semibold">Build Status</th>
                <th className="pb-3 font-semibold text-right">EAS Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {DEPLOYMENTS.map(dep => (
                <tr key={dep.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-bold text-white">{dep.tenantName}</td>
                  <td className="py-4 font-mono text-slate-400">{dep.bundleId}</td>
                  <td className="py-4 text-slate-300 font-mono">{dep.version}</td>
                  <td className="py-4 text-cyan-400 font-semibold">{dep.activeDrivers} Dedicated Riders</td>
                  <td className="py-4">
                    {dep.status === 'LIVE_STORES' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        App Store & Play Store LIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                        EAS Build Queued
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700">
                      Trigger OTA Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;
