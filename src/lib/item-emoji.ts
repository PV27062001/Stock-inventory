// Maps a rental-item name (English or Tamil keywords) to a recognisable emoji,
// so items are visual even before a photo is added. Falls back to a box.
const EMOJI_MAP: { keys: string[]; emoji: string }[] = [
  { keys: ['ladder', 'ஏணி'], emoji: '🪜' },
  { keys: ['chair', 'நாற்காலி'], emoji: '🪑' },
  { keys: ['table', 'மேசை', 'டேபிள்'], emoji: '🍽️' },
  { keys: ['pot', 'vessel', 'பாத்திர', 'சட்டி', 'cooker', 'குக்கர்'], emoji: '🍲' },
  { keys: ['stove', 'அடுப்பு', 'gas'], emoji: '🔥' },
  { keys: ['light', 'விளக்கு', 'bulb', 'serial', 'lamp'], emoji: '💡' },
  { keys: ['tent', 'shamiana', 'சாமியானா', 'pandal', 'பந்தல்'], emoji: '⛺' },
  { keys: ['stage', 'மேடை'], emoji: '🎪' },
  { keys: ['speaker', 'mic', 'mike', 'sound', 'ஒலி'], emoji: '🔊' },
  { keys: ['fan', 'விசிறி'], emoji: '🪭' },
  { keys: ['drum', 'barrel', 'பீப்பாய்', 'பறை'], emoji: '🛢️' },
  { keys: ['plate', 'தட்டு', 'thali'], emoji: '🍽️' },
  { keys: ['glass', 'tumbler', 'டம்ளர்'], emoji: '🥛' },
  { keys: ['cup', 'குவளை'], emoji: '🥤' },
  { keys: ['bucket', 'வாளி'], emoji: '🪣' },
  { keys: ['generator', 'மின்'], emoji: '🔌' },
  { keys: ['carpet', 'mat', 'விரிப்பு'], emoji: '🟫' },
  { keys: ['water', 'தண்ணீர்', 'tank'], emoji: '🚰' },
];

export function itemEmoji(name: string): string {
  const n = (name || '').toLowerCase();
  for (const m of EMOJI_MAP) {
    if (m.keys.some((k) => n.includes(k.toLowerCase()))) return m.emoji;
  }
  return '📦';
}
