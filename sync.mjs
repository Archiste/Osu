import { writeFile, mkdir } from 'node:fs/promises'; 

const ID = process.env.OSU_USER_ID || '16021128';
const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) { console.error('Missing OSU_CLIENT_ID / OSU_CLIENT_SECRET'); process.exit(1); }

const tokenRes = await fetch('https://osu.ppy.sh/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ client_id: Number(OSU_CLIENT_ID), client_secret: OSU_CLIENT_SECRET, grant_type: 'client_credentials', scope: 'public' })
});
if (!tokenRes.ok) { console.error('Token error', tokenRes.status, await tokenRes.text()); process.exit(1); }
const { access_token } = await tokenRes.json();

const api = async (path) => {
  const r = await fetch('https://osu.ppy.sh/api/v2' + path, { headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
};

const user = await api(`/users/${ID}/osu?key=id`);
const best = await api(`/users/${ID}/scores/best?mode=osu&limit=5`);
const s = user.statistics || {};

const out = {
  id: user.id,
  username: user.username,
  country_code: user.country_code ?? null,
  avatar_url: user.avatar_url ?? `https://a.ppy.sh/${ID}`,
  global_rank: s.global_rank ?? null,
  country_rank: s.country_rank ?? null,
  pp: s.pp ?? null,
  accuracy: s.hit_accuracy ?? null,
  play_count: s.play_count ?? null,
  play_time_hours: s.play_time != null ? Math.round(s.play_time / 3600) : null,
  level: s.level?.current ?? null,
  grades: s.grade_counts ?? null,
  top_plays: best.map((b) => ({
    title: b.beatmapset?.title,
    artist: b.beatmapset?.artist,
    version: b.beatmap?.version,
    stars: b.beatmap?.difficulty_rating,
    rank: b.rank,
    accuracy: b.accuracy != null ? b.accuracy * 100 : null,
    pp: b.pp,
    mods: (b.mods || []).map((m) => (typeof m === 'string' ? m : m.acronym)),
    url: b.beatmap?.id ? `https://osu.ppy.sh/beatmaps/${b.beatmap.id}` : null
  })),
  updated_at: new Date().toISOString()
};

await mkdir('data', { recursive: true });
await writeFile('data/profile.json', JSON.stringify(out, null, 2) + '\n');
console.log('Synced', out.username, 'rank', out.global_rank);
