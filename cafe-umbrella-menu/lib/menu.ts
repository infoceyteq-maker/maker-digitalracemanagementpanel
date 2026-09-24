export type CategoryId = 'soup' | 'stews' | 'main' | 'roti' | 'kottu';

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
}

export interface MenuItem {
  id: string;
  /** Matching product id inside the Restaurant Admin panel (Digital Race backend). */
  panelId: string;
  category: CategoryId;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  prepMins: number;
  serves: string;
  spice: 0 | 1 | 2 | 3;
  image: string;
  badge?: 'SIGNATURE' | 'BESTSELLER' | "CHEF'S PICK" | 'VEGETARIAN' | 'NEW';
  offer?: string;
}

export const CATEGORIES: Category[] = [
  { id: 'soup',   name: 'Soup',            tagline: 'Warm welcomes from the hills' },
  { id: 'stews',  name: 'Stews',           tagline: 'Slow-simmered, deep & velvety' },
  { id: 'main',   name: 'Main Dish',       tagline: 'Hearty plates, mountain sized' },
  { id: 'roti',   name: 'Signature Roti',  tagline: 'Golden, flaky, unmistakably ours' },
  { id: 'kottu',  name: 'Kottu Junction',  tagline: 'The rhythm of the blade · freshly chopped' },
];

export const MENU: MenuItem[] = [
  // ─── Soup ─────────────────────────────────────────────
  {
    id: 'golden-pumpkin',
    panelId: 'cu-p-1',
    category: 'soup',
    name: 'Golden Pumpkin Velouté',
    price: 750,
    description:
      'Silky hill-country pumpkin slow-sweated with ginger, finished with a swirl of coconut cream and toasted seeds. Warm, sweet and impossibly smooth.',
    ingredients: ['Pumpkin', 'Coconut Cream', 'Ginger', 'Toasted Pumpkin Seeds', 'Micro Herbs', 'Chili Oil'],
    prepMins: 10,
    serves: '1',
    spice: 0,
    image: '/menu/soup-pumpkin.jpg',
    badge: 'NEW',
  },
  {
    id: 'clear-herb-chicken',
    panelId: 'cu-p-2',
    category: 'soup',
    name: 'Clear Chicken Herb Soup',
    price: 850,
    description:
      'A crystal-clear golden broth simmered for hours with free-range chicken, glass noodles and fresh coriander. Restorative mountain comfort in a bowl.',
    ingredients: ['Chicken', 'Glass Noodles', 'Spring Onion', 'Coriander', 'Lime', 'Bird’s Eye Chili'],
    prepMins: 12,
    serves: '1',
    spice: 1,
    image: '/menu/soup-chicken.jpg',
  },

  // ─── Stews ────────────────────────────────────────────
  {
    id: 'ceylon-chicken-stew',
    panelId: 'cu-p-3',
    category: 'stews',
    name: 'Creamy Ceylon Chicken Stew',
    price: 1400,
    description:
      'Tender chicken folded into velvety coconut milk with curry leaves, cardamom and carrot. Served with two golden buttered roti for dipping.',
    ingredients: ['Chicken', 'Coconut Milk', 'Carrot', 'Curry Leaves', 'Cardamom', 'Black Pepper', 'Butter Roti'],
    prepMins: 20,
    serves: '1–2',
    spice: 1,
    image: '/menu/stew-chicken.jpg',
    badge: 'BESTSELLER',
  },
  {
    id: 'devil-beef-hotpot',
    panelId: 'cu-p-4',
    category: 'stews',
    name: 'Devilled Beef Hot Pot',
    price: 1750,
    description:
      'Caramelised beef chunks glazed in dark soy with charred bell peppers, onions and dried chilies — served bubbling in a cast-iron pot.',
    ingredients: ['Beef', 'Dark Soy', 'Bell Peppers', 'Onions', 'Dried Chilies', 'Sesame', 'Spring Onion'],
    prepMins: 22,
    serves: '1–2',
    spice: 3,
    image: '/menu/stew-beef.jpg',
    offer: 'Free welcome papadam basket with every Hot Pot',
  },

  // ─── Main Dish ────────────────────────────────────────
  {
    id: 'ella-mountain-curry',
    panelId: 'cu-p-5',
    category: 'main',
    name: 'Ella Mountain Chicken Curry & Rice',
    price: 1650,
    description:
      'Our house clay-pot chicken curry — rich amber gravy, whole spices and a smoky depth — over fluffy samba rice, lined with banana leaf.',
    ingredients: ['Chicken', 'Samba Rice', 'Clay-Pot Spices', 'Coconut Milk', 'Curry Leaves', 'Papadam', 'Green Chili'],
    prepMins: 18,
    serves: '1',
    spice: 2,
    image: '/menu/main-curry.jpg',
    badge: "CHEF'S PICK",
  },
  {
    id: 'fire-wok-nasi',
    panelId: 'cu-p-6',
    category: 'main',
    name: 'Fire Wok Nasi Goreng',
    price: 1500,
    description:
      'Smoky wok-charred fried rice crowned with a glossy fried egg, chicken satay skewers and prawn crackers. Sweet, savoury, fire-kissed.',
    ingredients: ['Fried Rice', 'Fried Egg', 'Chicken Satay', 'Prawn Crackers', 'Fried Shallots', 'Cucumber', 'Sambal'],
    prepMins: 15,
    serves: '1',
    spice: 1,
    image: '/menu/main-nasi.jpg',
  },

  // ─── Signature Roti ───────────────────────────────────
  {
    id: 'umbrella-signature-roti',
    panelId: 'cu-p-7',
    category: 'roti',
    name: 'Umbrella Signature Chicken Roti',
    price: 850,
    description:
      'Golden paratha parcels packed with spiced shredded chicken and potato, brushed with butter and kissed by the flame. One is never enough.',
    ingredients: ['Godhamba Roti', 'Chicken', 'Potato', 'Butter', 'Onions', 'House Spice Mix', 'Lime'],
    prepMins: 10,
    serves: '2 pieces',
    spice: 1,
    image: '/menu/roti-signature.jpg',
    badge: 'BESTSELLER',
    offer: 'Buy 3 get the 4th free — all day, every day',
  },
  {
    id: 'pol-roti-lunumiris',
    panelId: 'cu-p-8',
    category: 'roti',
    name: 'Island Pol Roti & Lunu Miris',
    price: 450,
    description:
      'Rustic coconut flatbreads with toasted coconut flecks, straight off the pan, with a fierce red lunu miris. Simple. Perfect. Sri Lankan.',
    ingredients: ['Fresh Coconut', 'Wheat Flour', 'Lunu Miris (Onion Sambol)', 'Chili', 'Lime', 'Sea Salt'],
    prepMins: 8,
    serves: '3 pieces',
    spice: 2,
    image: '/menu/roti-pol.jpg',
    badge: 'VEGETARIAN',
  },

  // ─── Kottu Junction ───────────────────────────────────
  {
    id: 'umbrella-legend-kottu',
    panelId: 'cu-p-9',
    category: 'kottu',
    name: 'Umbrella Ultimate Legend Kottu',
    price: 1900,
    description:
      'The dish that built our name. A mountain of godhamba roti chopped at full tempo with chicken, egg, mushrooms and sausage — glossy, smoky, legendary.',
    ingredients: ['Carrot', 'Leeks', 'Cabbage', 'Beans', 'Chicken', 'Egg', 'Mushrooms', 'Sausage'],
    prepMins: 20,
    serves: '1–2',
    spice: 2,
    image: '/menu/kottu-legend.jpg',
    badge: 'SIGNATURE',
    offer: 'FREE iced coffee + cashew salad with every Legend Kottu',
  },
  {
    id: 'chicken-cheese-blast',
    panelId: 'cu-p-10',
    category: 'kottu',
    name: 'Chicken Cheese Blast Kottu',
    price: 1550,
    description:
      'Grilled chicken and chopped roti buried under a molten mozzarella avalanche. Pull a spoon through it and watch the cheese stretch.',
    ingredients: ['Godhamba Roti', 'Grilled Chicken', 'Mozzarella', 'Carrot', 'Leeks', 'Egg', 'Chili Flakes'],
    prepMins: 15,
    serves: '1',
    spice: 1,
    image: '/menu/kottu-cheese.jpg',
    badge: 'BESTSELLER',
  },
  {
    id: 'midnight-egg-cheese',
    panelId: 'cu-p-11',
    category: 'kottu',
    name: 'Midnight Egg & Cheese Kottu',
    price: 1350,
    description:
      'Golden roti ribbons folded with fluffy scrambled egg and melted cheese — the 11 PM craving, answered.',
    ingredients: ['Godhamba Roti', 'Egg', 'Cheese', 'Onion', 'Green Chili', 'Coriander', 'Cracked Pepper'],
    prepMins: 14,
    serves: '1',
    spice: 1,
    image: '/menu/kottu-egg.jpg',
  },
  {
    id: 'ella-greens-veg',
    panelId: 'cu-p-12',
    category: 'kottu',
    name: 'Ella Greens Veggie Kottu',
    price: 1150,
    description:
      'A garden in a wok — carrot, beans, leeks and cabbage chopped through soft roti with your choice of egg. Bright, fresh and fiercely satisfying.',
    ingredients: ['Godhamba Roti', 'Carrot', 'Beans', 'Leeks', 'Cabbage', 'Capsicum', 'Egg (optional)'],
    prepMins: 12,
    serves: '1',
    spice: 1,
    image: '/menu/kottu-veg.jpg',
    badge: 'VEGETARIAN',
  },
];

export const TENANT_SLUG = 'cafe-umbrella';

export const BRAND = {
  name: 'Cafe Umbrella',
  sub: 'ROTI & KOTTU HUB',
  tagline: 'Experience the taste of mountains!',
  town: 'Ella',
  country: 'Sri Lanka',
  hours: '8:00 — 23:00',
  address: 'Passara Road 3rd Mile, Ella, Uva Province 90090',
  phone: '+94 71 205 4801',
  whatsapp: '94712054801',
  links: {
    maps: 'https://share.google/cYiIixkUGF5D3pMt7',
    instagram: 'https://www.instagram.com/cafe_umbrella_',
    facebook: 'https://www.facebook.com/profile.php?id=61573828236464',
  },
  rating: '4.9',
};

export const formatLKR = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

export const SPICE_LABELS = ['', 'Mild', 'Medium', 'Hot'] as const;
