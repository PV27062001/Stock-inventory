export interface GroceryEntry {
  name: string; // English / common name
  ta: string; // Tamil name
  emoji: string;
}

// Common Tamil Nadu kirana/grocery items with a clear icon each.
export const GROCERY_LIST: GroceryEntry[] = [
  // Flours & rava
  { name: 'Maida', ta: 'மைதா', emoji: '🌾' },
  { name: 'Wheat (Godhumai)', ta: 'கோதுமை', emoji: '🌾' },
  { name: 'Wheat Flour (Atta)', ta: 'கோதுமை மாவு', emoji: '🌾' },
  { name: 'Wheat Rava (Godhumai Ravai)', ta: 'கோதுமை ரவை', emoji: '🌾' },
  { name: 'White Rava (Vella Ravai)', ta: 'வெள்ளை ரவை', emoji: '🌾' },
  { name: 'Rava / Sooji', ta: 'ரவை', emoji: '🌾' },
  { name: 'Rice Flour (Arisi Maavu)', ta: 'அரிசி மாவு', emoji: '🌾' },
  { name: 'Gram Flour (Kadalai Maavu)', ta: 'கடலை மாவு', emoji: '🌾' },
  { name: 'Ragi Flour', ta: 'கேழ்வரகு மாவு', emoji: '🌾' },
  // Rice
  { name: 'Rice (Arisi)', ta: 'அரிசி', emoji: '🍚' },
  { name: 'Idli Rice', ta: 'இட்லி அரிசி', emoji: '🍚' },
  { name: 'Boiled Rice (Puzhungal)', ta: 'புழுங்கல் அரிசி', emoji: '🍚' },
  { name: 'Basmati Rice', ta: 'பாஸ்மதி அரிசி', emoji: '🍚' },
  { name: 'Poha / Aval', ta: 'அவல்', emoji: '🥣' },
  // Dals & pulses
  { name: 'Toor Dal (Thuvaram Paruppu)', ta: 'துவரம் பருப்பு', emoji: '🫘' },
  { name: 'Moong Dal (Paasi Paruppu)', ta: 'பாசிப் பருப்பு', emoji: '🫘' },
  { name: 'Urad Dal (Ulundhu)', ta: 'உளுந்து', emoji: '🫘' },
  { name: 'Channa Dal (Kadalai Paruppu)', ta: 'கடலைப் பருப்பு', emoji: '🫘' },
  { name: 'Groundnut (Verkadalai)', ta: 'வேர்க்கடலை', emoji: '🥜' },
  // Oils & dairy
  { name: 'Cooking Oil (Ennai)', ta: 'சமையல் எண்ணெய்', emoji: '🫗' },
  { name: 'Gingelly Oil (Nallennai)', ta: 'நல்லெண்ணெய்', emoji: '🫗' },
  { name: 'Ghee (Nei)', ta: 'நெய்', emoji: '🧈' },
  { name: 'Milk (Paal)', ta: 'பால்', emoji: '🥛' },
  { name: 'Curd (Thayir)', ta: 'தயிர்', emoji: '🥛' },
  { name: 'Butter', ta: 'வெண்ணெய்', emoji: '🧈' },
  { name: 'Egg (Muttai)', ta: 'முட்டை', emoji: '🥚' },
  // Sweeteners & salt
  { name: 'Sugar (Sakkarai)', ta: 'சர்க்கரை', emoji: '🍬' },
  { name: 'Jaggery (Vellam)', ta: 'வெல்லம்', emoji: '🟫' },
  { name: 'Salt (Uppu)', ta: 'உப்பு', emoji: '🧂' },
  // Spices
  { name: 'Red Chilli (Milagai)', ta: 'மிளகாய்', emoji: '🌶️' },
  { name: 'Turmeric (Manjal)', ta: 'மஞ்சள்', emoji: '🟡' },
  { name: 'Coriander (Dhaniya)', ta: 'தனியா', emoji: '🌿' },
  { name: 'Cumin (Jeeragam)', ta: 'சீரகம்', emoji: '🫘' },
  { name: 'Mustard (Kadugu)', ta: 'கடுகு', emoji: '🟡' },
  { name: 'Pepper (Milagu)', ta: 'மிளகு', emoji: '⚫' },
  { name: 'Tamarind (Puli)', ta: 'புளி', emoji: '🟤' },
  { name: 'Asafoetida (Perungayam)', ta: 'பெருங்காயம்', emoji: '🟡' },
  // Vegetables & essentials
  { name: 'Onion (Vengayam)', ta: 'வெங்காயம்', emoji: '🧅' },
  { name: 'Tomato (Thakkali)', ta: 'தக்காளி', emoji: '🍅' },
  { name: 'Potato (Urulai)', ta: 'உருளைக்கிழங்கு', emoji: '🥔' },
  { name: 'Garlic (Poondu)', ta: 'பூண்டு', emoji: '🧄' },
  { name: 'Ginger (Inji)', ta: 'இஞ்சி', emoji: '🫚' },
  { name: 'Coconut (Thengai)', ta: 'தேங்காய்', emoji: '🥥' },
  { name: 'Lemon (Elumichai)', ta: 'எலுமிச்சை', emoji: '🍋' },
  // Beverages & others
  { name: 'Tea (Theyilai)', ta: 'தேயிலை', emoji: '🍵' },
  { name: 'Coffee', ta: 'காபி', emoji: '☕' },
  { name: 'Vermicelli (Semiya)', ta: 'சேமியா', emoji: '🍜' },
  { name: 'Bread', ta: 'பிரெட்', emoji: '🍞' },
  { name: 'Cashew (Mundhiri)', ta: 'முந்திரி', emoji: '🥜' },
  { name: 'Dry Grapes (Kismis)', ta: 'திராட்சை', emoji: '🍇' },
];

export function searchGroceries(query: string, limit = 8): GroceryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const raw = query.trim();
  return GROCERY_LIST.filter(
    (g) => g.name.toLowerCase().includes(q) || g.ta.includes(raw),
  ).slice(0, limit);
}
