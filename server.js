import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const app = express();
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());

const PORT = process.env.PORT || 8080;
const WORK = '/tmp/spacebar';

function ensureWorkDir() {
  if (!fs.existsSync(WORK)) fs.mkdirSync(WORK, { recursive: true });
}

// Serve packaged HLS segments
app.use('/hls', express.static(WORK));

// Package EC-3 audio HLS (copy EC-3 into fMP4 segments)
// GET /api/hls/package-ec3?src=...
app.get('/api/hls/package-ec3', async (req, res) => {
  try {
    ensureWorkDir();
    const input = resolveInput(req.query.src);
    if (!input) return res.status(400).json({ ok: false, error: 'invalid src' });
    const id = crypto.randomBytes(8).toString('hex');
    const outDir = path.join(WORK, id);
    await fsp.mkdir(outDir, { recursive: true });

    const outPath = path.join(outDir, 'ec3.m3u8');
    const args = [
      '-y',
      // Spoof headers so origin allows server-side fetch
      '-user_agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      '-headers', 'Referer: https://sirround.me',
      '-i', input,
      '-map', 'a:0',
      '-c:a', 'copy',
      '-movflags', 'frag_keyframe+empty_moov+separate_moof+omit_tfhd_offset+isml',
      '-f', 'hls',
      '-hls_time', '4',
      '-hls_list_size', '0',
      '-hls_segment_type', 'fmp4',
      '-master_pl_name', 'master.m3u8',
      '-hls_segment_filename', path.join(outDir, 'ec3_%03d.m4s'),
      outPath,
    ];
    await execFileAsync('ffmpeg', args);
    const base = `${req.protocol}://${req.get('host')}`;
    const baseUrl = `${base}/hls/${id}`;
    res.json({ ok: true, id, hls: `${baseUrl}/ec3.m3u8`, master: `${baseUrl}/master.m3u8`, baseUrl });
  } catch (e) {
    const err = e || {};
    res.status(500).json({ ok: false, error: err.message || 'package-ec3 failed', stderr: err.stderr || '', stdout: err.stdout || '' });
  }
});

function resolveInput(src) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return null; // restrict to URLs for hosted service
}

function execFileAsync(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout: stdout?.toString?.(), stderr: stderr?.toString?.() }));
      resolve({ stdout: stdout?.toString?.(), stderr: stderr?.toString?.() });
    });
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// TMDB proxy (server-side token)
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
function imageUrl(path, size = 'w500') { if (!path) return ''; return `${TMDB_IMAGE_BASE}/${size}${path}`; }
function toTitle(r) {
  const date = r.release_date || r.first_air_date || '';
  const year = date ? Number(date.slice(0, 4)) : 0;
  const titleText = (r.title || r.name || '').toLowerCase();
  const isDynamite = titleText.includes('house of dynamite');
  const isBDPSex = r.id === 10664136 || titleText.includes('sex and violence') || isDynamite;
  const isWitcher = /witcher/.test(titleText);
  const defaultPoster = imageUrl(r.poster_path, 'w500');
  const defaultBackdrop = imageUrl(r.backdrop_path, 'original');
  const poster = isBDPSex
    ? '/boogiedownproduction_sexandviolence_7ur1.jpg'
    : isWitcher
    ? '/star wars-thrawn ascendancy-chaos risingb1.jpg'
    : r.id === 200875 || r.id === 106646
    ? '/Oppenheimer X minimalist cropped.jpg'
    : defaultPoster;
  const backdrop = isWitcher ? '' : (isDynamite ? '' : defaultBackdrop);
  let name = r.title || r.name || 'Untitled';
  if (isBDPSex) name = 'Boogie Down Productions – Sex And Violence (1992)';
  if (isWitcher) name = 'Star Wars: Thrawn Ascendancy: Chaos Rising, Book 1';
  if (name === 'IT: Welcome To Derry' || r.id === 200875 || r.id === 106646) name = 'Oppenheimer (2023) [7.1.4 DOLBY ATMOS]';
  if (name === 'Stranger Things') name = 'Stranger Things [7.1.4 DOLBY ATMOS]';
  const SUFFIX = ' [7.1.4 DOLBY ATMOS]';
  if (!name.endsWith(SUFFIX)) name = name + SUFFIX;
  return {
    id: String(r.id),
    name,
    overview: isWitcher ? 'Beyond the edge of the galaxy lies the Unknown Regions: chaotic, uncharted, and near impassable, with hidden secrets and dangers in equal measure...' : (r.overview || ''),
    poster,
    backdrop,
    year,
    mediaUrl: isWitcher ? 'https://sirround.me/thrawn1-ec3.mkv' : undefined,
  };
}
async function tmdbFetch(path, query = {}) {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error('Missing TMDB_ACCESS_TOKEN');
  const params = new URLSearchParams({ language: 'en-US', ...Object.fromEntries(Object.entries(query).map(([k,v]) => [k, String(v)])) });
  const url = `${TMDB_API_BASE}${path}?${params.toString()}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } });
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}
app.get('/api/tmdb/trending', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/all/week');
    const items = (data.results || []).map(toTitle).filter(t => t.poster).filter((t, i, a) => a.findIndex(x => x.name === t.name) === i);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, items });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/api/tmdb/popular', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/popular', { page: 1 });
    const items = (data.results || []).map(toTitle).filter(t => t.poster).filter((t, i, a) => a.findIndex(x => x.name === t.name) === i);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, items });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/api/tmdb/top', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated', { page: 1 });
    const items = (data.results || []).map(toTitle).filter(t => t.poster).filter((t, i, a) => a.findIndex(x => x.name === t.name) === i);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, items });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Probe media with ffprobe
app.get('/api/media/probe', async (req, res) => {
  try {
    const input = resolveInput(req.query.src);
    if (!input) return res.status(400).json({ ok: false, error: 'invalid src' });
    const { stdout } = await execFileAsync('ffprobe', [
      '-v','error',
      '-show_streams',
      '-show_format',
      '-print_format','json',
      input,
    ]);
    const data = JSON.parse(stdout || '{}');
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const a = streams.find(s => s.codec_type === 'audio');
    const channels = a?.channels;
    // FOA heuristic
    let foa = 'off';
    if (channels === 4) {
      const tags = { ...(a?.tags||{}), ...(data.format?.tags||{}) };
      const blob = Object.values(tags).join('\n').toLowerCase();
      if (/fuma|fu-ma/.test(blob)) foa = 'fuma';
      else if (/ambix|acn|sn3d/.test(blob)) foa = 'ambix';
      else foa = 'ambix';
    }
    res.json({ ok: true, channels, foa, format: data.format, streams });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'probe failed' });
  }
});

// Package a visualization-only AAC stereo HLS feed
// GET /api/hls/package?src=...
app.get('/api/hls/package', async (req, res) => {
  try {
    ensureWorkDir();
    const input = resolveInput(req.query.src);
    if (!input) return res.status(400).json({ ok: false, error: 'invalid src' });
    const id = crypto.randomBytes(8).toString('hex');
    const outDir = path.join(WORK, id);
    await fsp.mkdir(outDir, { recursive: true });

    const vizPath = path.join(outDir, 'viz.m3u8');
    // Build audio-only HLS at 128k stereo AAC for visualization; 4s segments
    const args = [
      '-y',
      '-i', input,
      '-map', 'a:0',
      '-ac', '2',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-hls_time', '4',
      '-hls_list_size', '0',
      '-hls_segment_filename', path.join(outDir, 'viz_%03d.ts'),
      vizPath,
    ];
    await execFileAsync('ffmpeg', args);

    const base = `${req.protocol}://${req.get('host')}`;
    const baseUrl = `${base}/hls/${id}`;
    res.json({ ok: true, id, viz: `${baseUrl}/viz.m3u8`, baseUrl });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'package failed' });
  }
});

// Serve packaged HLS folders from /tmp/spacebar
app.use('/hls/:id', (req, res, next) => {
  const dir = path.join(WORK, req.params.id);
  if (!fs.existsSync(dir)) return res.status(404).end();
  express.static(dir, { fallthrough: false })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`spacebar-api listening on :${PORT}`);
});
