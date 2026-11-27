import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const port = Number(process.env.PERSONAL_WEBSITE_PORT || 4173);
const root = resolve('dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Path outside dist');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Path is not a file');
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
    });
    if (request.method === 'HEAD') return response.end();
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Sayfa bulunamadı.');
  }
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
