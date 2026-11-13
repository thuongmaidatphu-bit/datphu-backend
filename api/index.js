/**
 * ============================================================================
 * VERCEL SERVERLESS FUNCTION HANDLER: ĐẤT PHÚ CORE ENGINE & TTS STREAMING
 * ============================================================================
 */
const https = require('https');
const server = require('../src/server');
const wisdomHandler = require('./wisdom');

module.exports = (req, res) => {
  const rawUrl = req.url || '';
  const preParsed = new URL(rawUrl, 'http://localhost');
  const origPath = preParsed.searchParams.get('__origPath');
  if (origPath) {
    preParsed.searchParams.delete('__origPath');
    const restQs = preParsed.searchParams.toString();
    req.url = origPath + (restQs ? '?' + restQs : '');
  }

  const reqUrl = req.url || '';
  const parsed = new URL(reqUrl, 'http://localhost');

  // 1. CỔNG AI MINH TRIẾT NHÂN LOẠI GEMINI (CÓ CACHE)
  if (parsed.searchParams.get('action') === 'wisdom' || reqUrl.includes('wisdom')) {
    return wisdomHandler(req, res);
  }

  const q = parsed.searchParams.get('q') || '';

  // 2. CỔNG PHÁT ÂM THANH GIỌNG NÓI TTS TIẾNG VIỆT (STREAMING MP3)
  if (reqUrl.includes('tts') || q) {
    const textToSpeak = q || 'Lịch Đất Phú';
    const ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=' + encodeURIComponent(textToSpeak);

    return https.get(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      proxyRes.pipe(res);
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('TTS Error: ' + err.message);
    });
  }

  // 2. CHUYỂN TIẾP ĐẾN MÁY CHỦ HTTP ĐẤT PHÚ
  server.emit('request', req, res);
};
