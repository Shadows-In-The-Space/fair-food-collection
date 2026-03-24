const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = '/home/sonny/goldencrumb/emails.json';
const PORT = 3001;

function loadEmails() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveEmails(emails) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(emails, null, 2));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const server = http.createServer((req, res) => {
  // CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /emails — admin view (returns count only for privacy)
  if (url.pathname === '/emails' && req.method === 'GET') {
    const emails = loadEmails();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: emails.length, last: emails[emails.length - 1]?.timestamp || null }));
    return;
  }

  // POST /subscribe
  if (url.pathname === '/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);
        if (!email || !isValidEmail(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Ungültige E-Mail-Adresse' }));
          return;
        }
        const emails = loadEmails();
        const exists = emails.find(e => e.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Diese E-Mail-Adresse ist bereits registriert' }));
          return;
        }
        emails.push({ email: email.toLowerCase(), timestamp: new Date().toISOString() });
        saveEmails(emails);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Willkommen! Du hörst von uns.' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fehlerhafte Anfrage' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Newsletter server running on port ${PORT}`);
});
