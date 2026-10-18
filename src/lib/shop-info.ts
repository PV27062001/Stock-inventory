/** Shop details printed on every bill. Override via NEXT_PUBLIC_SHOP_* env vars. */
export const SHOP = {
  nameTa: process.env.NEXT_PUBLIC_SHOP_NAME_TA || 'ஸ்ரீ அம்மன்',
  name: process.env.NEXT_PUBLIC_SHOP_NAME || 'SRI AMMAN',
  taglineTa: process.env.NEXT_PUBLIC_SHOP_TAGLINE_TA || 'சமையல் பாத்திரகடை',
  tagline: process.env.NEXT_PUBLIC_SHOP_TAGLINE || 'Kitchenware & Rental Materials',
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || '',
  phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '',
} as const;
