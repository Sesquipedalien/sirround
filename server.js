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
