import { NextResponse } from 'next/server';

// Refresh shutdown news every 30 minutes.
export const revalidate = 1800;

type NewsItem = { title: string; link: string; pubDate: string; source: string };

const strip = (s: string) =>
  s
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

export async function GET() {
  try {
    const query = 'Coimbatore power shutdown OR Thondamuthur power cut';
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query,
    )}&hl=en-IN&gl=IN&ceid=IN:en`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);

    const xml = await res.text();
    const pick = (block: string, tag: string) => {
      const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
      return m ? m[1] : '';
    };

    const items: NewsItem[] = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 12)
      .map((m) => {
        const b = m[1];
        return {
          title: strip(pick(b, 'title')),
          link: strip(pick(b, 'link')),
          pubDate: pick(b, 'pubDate').trim(),
          source: strip(pick(b, 'source')),
        };
      })
      .filter((i) => i.title);

    return NextResponse.json({ items, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shutdown news' }, { status: 502 });
  }
}
