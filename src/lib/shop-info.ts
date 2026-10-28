/** Shop details printed on every bill. Override via SRIAMMAN_SHOP_* env vars. */
export const SHOP = {
  nameTa: process.env.SRIAMMAN_SHOP_NAME_TA || 'ஸ்ரீ அம்மன்',
  name: process.env.SRIAMMAN_SHOP_NAME || 'SRI AMMAN',
  taglineTa: process.env.SRIAMMAN_SHOP_TAGLINE_TA || 'சமையல் பாத்திரகடை',
  tagline: process.env.SRIAMMAN_SHOP_TAGLINE || 'Kitchenware & Rental Materials',
  address: process.env.SRIAMMAN_SHOP_ADDRESS || '',
  phone: process.env.SRIAMMAN_SHOP_PHONE || '',
} as const;
