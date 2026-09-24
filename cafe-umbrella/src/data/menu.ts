export interface Dish {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  image: string;
  tagline: string;
  ingredients: string[];
  prepTime: number;
  specialOffer?: string;
  isSignature?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
}

export type CategoryId =
  | 'soup'
  | 'stews'
  | 'omelette'
  | 'main'
  | 'chopsey'
  | 'boiled'
  | 'roti'
  | 'kottu';

export interface Category {
  id: CategoryId;
  name: string;
}

export const RESTAURANT = {
  name: 'Cafe Umbrella',
  location: 'Ella',
  tagline: 'Slow food in the highlands',
  currency: 'Rs.',
  phone: '+94 77 000 0000',
  address: 'Ella, Badulla District, Sri Lanka',
};

export const CATEGORIES: Category[] = [
  { id: 'soup', name: 'Soup' },
  { id: 'stews', name: 'Stews' },
  { id: 'omelette', name: 'Omelette' },
  { id: 'main', name: 'Main Dish' },
  { id: 'chopsey', name: 'Chopsey' },
  { id: 'boiled', name: 'Boiled Vegetables' },
  { id: 'roti', name: 'Signature Roti' },
  { id: 'kottu', name: 'Kottu Junction' },
];

export const DISHES: Dish[] = [
  {
    id: 'ultimate-legend-kottu',
    name: 'Umbrella Ultimate Legend Kottu',
    price: 1900,
    category: 'kottu',
    image: '/dishes/kottu-hero.webp',
    tagline: 'Our house legend — chopped roti wok-tossed with chicken, egg and the Ella pepper blend.',
    ingredients: ['Chicken', 'Egg', 'Cabbage', 'Carrot', 'Leeks', 'Beans', 'Onion', 'Chili', 'Curry leaves'],
    prepTime: 20,
    specialOffer: '20% off before 6:30 PM',
    isSignature: true,
    isSpicy: true,
  },
  {
    id: 'ella-valley-pepper-chicken',
    name: 'Ella Valley Pepper Chicken & Mash',
    price: 1950,
    category: 'main',
    image: '/dishes/pepper-chicken-mash.webp',
    tagline: 'Grilled free-range chicken crushed in black pepper over silk-smooth potato mash.',
    ingredients: ['Chicken breast', 'Potato', 'Butter', 'Cream', 'Asparagus', 'Snap peas', 'Black pepper', 'Rosemary'],
    prepTime: 25,
    specialOffer: 'Free drink on weekdays',
    isSignature: true,
  },
  {
    id: 'umbrella-signature-chopsey',
    name: 'Umbrella Signature Chopsey',
    price: 1450,
    category: 'chopsey',
    image: '/dishes/chopsey.webp',
    tagline: 'Crisp noodles, wok-charred chicken and prawns in our thick house chopsey gravy.',
    ingredients: ['Crispy noodles', 'Chicken', 'Prawns', 'Cabbage', 'Carrot', 'Spring onion', 'Garlic', 'Oyster sauce'],
    prepTime: 18,
    isSpicy: true,
  },
  {
    id: 'coconut-roti-pol-sambol',
    name: 'Umbrella Coconut Roti with Pol Sambol',
    price: 450,
    category: 'roti',
    image: '/dishes/signature-roti.webp',
    tagline: 'Freshly grated coconut roti, flaky and warm, with fiery pol sambol and dhal.',
    ingredients: ['Coconut', 'Wheat flour', 'Chili', 'Onion', 'Maldive fish', 'Lime', 'Dhal curry'],
    prepTime: 10,
    isVegetarian: true,
    isSpicy: true,
  },
  {
    id: 'cream-of-mushroom-soup',
    name: 'Umbrella Cream of Mushroom Soup',
    price: 850,
    category: 'soup',
    image: '/dishes/mushroom-soup.webp',
    tagline: 'Ella highland mushrooms simmered slow, finished with cream and cracked pepper.',
    ingredients: ['Mushrooms', 'Cream', 'Onion', 'Garlic', 'Thyme', 'Butter', 'Black pepper'],
    prepTime: 12,
    isVegetarian: true,
  },
  {
    id: 'three-egg-cheese-omelette',
    name: 'Umbrella Three-Egg Cheese Omelette',
    price: 750,
    category: 'omelette',
    image: '/dishes/cheese-omelette.webp',
    tagline: 'Three farm eggs, molten cheddar, chili and onion — served with buttered toast.',
    ingredients: ['Eggs', 'Cheddar', 'Chili', 'Onion', 'Butter', 'Toast', 'Coriander'],
    prepTime: 9,
    isVegetarian: true,
  },
  {
    id: 'ella-highland-boiled-platter',
    name: 'Ella Highland Boiled Vegetable Platter',
    price: 850,
    category: 'boiled',
    image: '/dishes/boiled-vegetables.webp',
    tagline: 'Manioc, sweet potato, beans and cabbage from the Ella ridges, with katta sambol.',
    ingredients: ['Manioc', 'Sweet potato', 'Carrot', 'Green beans', 'Cabbage', 'Coconut sambol', 'Chili'],
    prepTime: 15,
    isVegetarian: true,
  },
  {
    id: 'slow-cooked-beef-stew',
    name: 'Slow-Cooked Beef Stew with Roti',
    price: 1750,
    category: 'stews',
    image: '/dishes/beef-stew.webp',
    tagline: 'Four-hour beef stew with potato, carrot and cinnamon, mopped up with hot roti.',
    ingredients: ['Beef', 'Potato', 'Carrot', 'Onion', 'Cinnamon', 'Curry leaves', 'Coconut milk', 'Roti'],
    prepTime: 30,
    isSpicy: true,
  },
];

export const categoryName = (id: CategoryId): string =>
  CATEGORIES.find((c) => c.id === id)?.name ?? id;
