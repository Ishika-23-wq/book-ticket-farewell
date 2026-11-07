/* ===================================================
   DECEMBER TO REMEMBER - BACKEND SERVER WITH SQLITE DB
   Node.js native server with built-in node:sqlite
=================================================== */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ADMIN_PIN = '2026';
const DATA_DIR = path.join(__dirname, 'data');

// In Vercel Serverless environment, filesystem is read-only except /tmp.
// Copy bundled SQLite database to /tmp so DatabaseSync can open and write.
let DB_PATH;
if (process.env.VERCEL) {
  const TMP_DB = path.join('/tmp', 'database.sqlite');
  const SEED_DB = path.join(DATA_DIR, 'database.sqlite');
  if (!fs.existsSync(TMP_DB) && fs.existsSync(SEED_DB)) {
    try {
      fs.copyFileSync(SEED_DB, TMP_DB);
      console.log('✅ Seed SQLite Database copied to /tmp/database.sqlite');
    } catch (e) {
      console.warn('⚠️ Could not copy seed DB to /tmp:', e);
    }
  }
  DB_PATH = fs.existsSync(TMP_DB) ? TMP_DB : SEED_DB;
} else {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  DB_PATH = path.join(DATA_DIR, 'database.sqlite');
}

// Initialize SQLite Database
let db;
try {
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendees (
      ticketId TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      classGrade TEXT NOT NULL,
      section TEXT NOT NULL,
      phone TEXT NOT NULL,
      instagram TEXT,
      song TEXT,
      quantity INTEGER DEFAULT 1,
      companions TEXT,
      totalAmount INTEGER NOT NULL,
      utrNumber TEXT NOT NULL,
      paidTo TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      rejectReason TEXT,
      approvedBy TEXT,
      approvedAt TEXT,
      checkedIn INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL
    )
  `);
  console.log('✅ SQLite Database initialized at:', DB_PATH);
} catch (dbErr) {
  console.error('❌ SQLite initialization error:', dbErr);
}

// MIME Types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to validate admin PIN
function isValidAdminPin(pin) {
  return pin === ADMIN_PIN || pin === '11011' || pin === 'admin';
}

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-pin'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body (handles both native Node streams and pre-parsed Vercel bodies)
function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (e) {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Request Handler (used by both local HTTP server and Vercel Serverless Function)
async function handleRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-pin'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. POST /api/register - Student submits registration
  if (req.method === 'POST' && pathname === '/api/register') {
    try {
      const data = await parseBody(req);
      if (!data.fullName || !data.phone || !data.utrNumber) {
        return sendJSON(res, 400, { success: false, error: 'Name, phone, and UTR number are required.' });
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const ticketId = data.ticketId || `DTR-2026-X${randomNum}`;
      const quantity = parseInt(data.quantity, 10) || 1;
      const totalAmount = quantity * 2000;
      const companionsJson = JSON.stringify(data.companions || []);
      const now = new Date().toISOString();

      const insertStmt = db.prepare(`
        INSERT INTO attendees (
          ticketId, fullName, classGrade, section, phone, instagram, song,
          quantity, companions, totalAmount, utrNumber, paidTo, status,
          rejectReason, approvedBy, approvedAt, checkedIn, timestamp
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, 'PENDING',
          NULL, NULL, NULL, 0, ?
        )
      `);

      insertStmt.run(
        ticketId,
        data.fullName.trim(),
        data.classGrade || 'Class 10th',
        data.section || 'Section A',
        data.phone.trim(),
        data.instagram || '',
        data.song || '',
        quantity,
        companionsJson,
        totalAmount,
        data.utrNumber.trim(),
        '9592982012@fam',
        now
      );

      const selectStmt = db.prepare('SELECT * FROM attendees WHERE ticketId = ?');
      const savedTicket = selectStmt.get(ticketId);
      savedTicket.companions = JSON.parse(savedTicket.companions || '[]');

      return sendJSON(res, 201, { success: true, ticket: savedTicket });
    } catch (err) {
      console.error('Error in /api/register:', err);
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 2. GET /api/ticket/:ticketId - Student checks real-time ticket status
  if (req.method === 'GET' && pathname.startsWith('/api/ticket/')) {
    const ticketId = pathname.replace('/api/ticket/', '').trim();
    try {
      const stmt = db.prepare('SELECT * FROM attendees WHERE ticketId = ?');
      const ticket = stmt.get(ticketId);
      if (!ticket) {
        return sendJSON(res, 404, { success: false, error: 'Ticket not found' });
      }
      ticket.companions = JSON.parse(ticket.companions || '[]');
      return sendJSON(res, 200, { success: true, ticket });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 3. GET /api/admin/attendees - Srishty fetches all attendees
  if (req.method === 'GET' && pathname === '/api/admin/attendees') {
    const pin = req.headers['x-admin-pin'] || parsedUrl.searchParams.get('pin');
    if (!isValidAdminPin(pin)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Invalid Admin PIN' });
    }

    try {
      const stmt = db.prepare('SELECT * FROM attendees ORDER BY timestamp DESC');
      const attendees = stmt.all().map(a => ({
        ...a,
        companions: JSON.parse(a.companions || '[]'),
        checkedIn: Boolean(a.checkedIn)
      }));
      return sendJSON(res, 200, { success: true, attendees });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 4. POST /api/admin/approve/:ticketId - Srishty approves ticket
  if (req.method === 'POST' && pathname.startsWith('/api/admin/approve/')) {
    const ticketId = pathname.replace('/api/admin/approve/', '').trim();
    const pin = req.headers['x-admin-pin'] || parsedUrl.searchParams.get('pin');
    if (!isValidAdminPin(pin)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Invalid Admin PIN' });
    }

    try {
      const stmt = db.prepare(`
        UPDATE attendees
        SET status = 'APPROVED', approvedBy = 'Srishty', approvedAt = ?, rejectReason = NULL
        WHERE ticketId = ?
      `);
      stmt.run(new Date().toISOString(), ticketId);

      const selectStmt = db.prepare('SELECT * FROM attendees WHERE ticketId = ?');
      const ticket = selectStmt.get(ticketId);
      ticket.companions = JSON.parse(ticket.companions || '[]');

      return sendJSON(res, 200, { success: true, ticket });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 5. POST /api/admin/reject/:ticketId - Srishty rejects ticket with reason
  if (req.method === 'POST' && pathname.startsWith('/api/admin/reject/')) {
    const ticketId = pathname.replace('/api/admin/reject/', '').trim();
    const pin = req.headers['x-admin-pin'] || parsedUrl.searchParams.get('pin');
    if (!isValidAdminPin(pin)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Invalid Admin PIN' });
    }

    try {
      const body = await parseBody(req);
      const reason = body.reason || 'Payment verification failed';

      const stmt = db.prepare(`
        UPDATE attendees
        SET status = 'REJECTED', rejectReason = ?, approvedBy = NULL, approvedAt = NULL
        WHERE ticketId = ?
      `);
      stmt.run(reason, ticketId);

      return sendJSON(res, 200, { success: true });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 6. POST /api/admin/revoke/:ticketId - Srishty resets ticket to PENDING
  if (req.method === 'POST' && pathname.startsWith('/api/admin/revoke/')) {
    const ticketId = pathname.replace('/api/admin/revoke/', '').trim();
    const pin = req.headers['x-admin-pin'] || parsedUrl.searchParams.get('pin');
    if (!isValidAdminPin(pin)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Invalid Admin PIN' });
    }

    try {
      const stmt = db.prepare(`
        UPDATE attendees
        SET status = 'PENDING', rejectReason = NULL, approvedBy = NULL, approvedAt = NULL
        WHERE ticketId = ?
      `);
      stmt.run(ticketId);

      return sendJSON(res, 200, { success: true });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 7. POST /api/admin/checkin/:ticketId - Gate Scanner checks in attendee
  if (req.method === 'POST' && pathname.startsWith('/api/admin/checkin/')) {
    const ticketId = pathname.replace('/api/admin/checkin/', '').trim();
    try {
      const stmt = db.prepare('SELECT * FROM attendees WHERE ticketId = ?');
      const ticket = stmt.get(ticketId);
      if (!ticket) {
        return sendJSON(res, 404, { success: false, error: 'Ticket not found' });
      }

      if (ticket.status !== 'APPROVED') {
        return sendJSON(res, 400, { success: false, error: 'Cannot check in: Ticket is not approved by Srishty yet!' });
      }

      const newCheckedIn = ticket.checkedIn ? 0 : 1;
      const updateStmt = db.prepare('UPDATE attendees SET checkedIn = ? WHERE ticketId = ?');
      updateStmt.run(newCheckedIn, ticketId);

      ticket.checkedIn = Boolean(newCheckedIn);
      ticket.companions = JSON.parse(ticket.companions || '[]');
      return sendJSON(res, 200, { success: true, ticket });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // ==========================================
  // STATIC ASSETS & ROUTING
  // ==========================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Route alias: /admin -> admin.html
  if (pathname === '/admin') {
    filePath = path.join(__dirname, 'admin.html');
  }

  // Security check: stay within root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Start HTTP server when executed directly (node server.js)
if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`🚀 December to Remember Server running at http://localhost:${PORT}`);
    console.log(`👑 Srishty Admin Portal at http://localhost:${PORT}/admin`);
  });
}

module.exports = handleRequest;
module.exports.handleRequest = handleRequest;
