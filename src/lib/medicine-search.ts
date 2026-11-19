export type MedicineEntry = { name: string; composition: string };

// public/medicines holds one file per first two letters (scripts/build-medicine-list.mjs).
const chunks = new Map<string, Promise<[string, string][]>>();

function loadChunk(key: string) {
  let chunk = chunks.get(key);
  if (!chunk) {
    chunk = fetch(`/medicines/${key}.json`)
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => {
        chunks.delete(key); // a network failure can be retried on the next letter typed
        return [];
      });
    chunks.set(key, chunk as Promise<[string, string][]>);
  }
  return chunk as Promise<[string, string][]>;
}

/** Medicine names for the add screen: names starting with the text first, then containing it. */
export async function searchMedicines(query: string, limit = 8): Promise<MedicineEntry[]> {
  const text = query.trim().toLowerCase();
  const key = text.replace(/[^a-z0-9]/g, '').slice(0, 2);
  if (key.length < 2) return [];

  const entries = await loadChunk(key);
  const matches = entries.filter(([name]) => name.toLowerCase().includes(text));
  const starting = matches.filter(([name]) => name.toLowerCase().startsWith(text));
  const others = matches.filter(([name]) => !name.toLowerCase().startsWith(text));
  return [...starting, ...others].slice(0, limit).map(([name, composition]) => ({ name, composition }));
}
