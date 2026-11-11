import { writeFileSync } from 'fs';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) { writeFileSync(process.env.AUDIT_OUT as string, await req.text()); return new Response('ok'); }
export async function GET(req: Request) { await new Promise((r) => setTimeout(r, Number(new URL(req.url).searchParams.get('ms') || 300))); return new Response('ok'); }
