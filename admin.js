/* ===================================================
   SRISHTY'S DEDICATED ADMIN PORTAL JS
   Connected directly to SQLite Database via REST API
   Organizes and displays all requests based on status
=================================================== */

const ADMIN_PIN_DEFAULT = '2026';
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000'))
  ? 'http://localhost:3000'
  : '';

let currentPin = sessionStorage.getItem('srishty_pin') || '';
// Default to 'all' so both existing approved/rejected and pending entries are immediately visible based on status
let currentFilter = sessionStorage.getItem('srishty_filter') || 'all';
let allAttendees = [];
let pollInterval = null;

// DOM Elements - Auth & Containers
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const connectionErrorBanner = document.getElementById('connectionErrorBanner');
const retryConnectionBtn = document.getElementById('retryConnectionBtn');
const pinInput = document.getElementById('pinInput');
const loginBtn = document.getElementById('loginBtn');
const lockBtn = document.getElementById('lockBtn');

// DOM Elements - Metrics
const metricPending = document.getElementById('metricPending');
const metricApproved = document.getElementById('metricApproved');
const metricRejected = document.getElementById('metricRejected');
const metricHeadcount = document.getElementById('metricHeadcount');
const metricRevenue = document.getElementById('metricRevenue');

// DOM Elements - Filter Buttons & Counters
const filterAllBtn = document.getElementById('filterAllBtn');
const filterPendingBtn = document.getElementById('filterPendingBtn');
const filterApprovedBtn = document.getElementById('filterApprovedBtn');
const filterRejectedBtn = document.getElementById('filterRejectedBtn');

const filterAllCount = document.getElementById('filterAllCount');
const filterPendingCount = document.getElementById('filterPendingCount');
const filterApprovedCount = document.getElementById('filterApprovedCount');
const filterRejectedCount = document.getElementById('filterRejectedCount');

// DOM Elements - Search & List
const searchInput = document.getElementById('searchInput');
const manualRefreshBtn = document.getElementById('manualRefreshBtn');
const attendeesListContainer = document.getElementById('attendeesListContainer');

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();

  setupEventListeners();
  updateFilterTabStyles();

  // Check URL params for pin auto-login (e.g. admin.html?pin=2026)
  const urlPin = new URLSearchParams(window.location.search).get('pin');
  if (urlPin) {
    tryLogin(urlPin);
  } else if (currentPin) {
    tryLogin(currentPin);
  }
});

function setupEventListeners() {
  loginBtn.addEventListener('click', () => {
    tryLogin(pinInput.value.trim());
  });

  pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      tryLogin(pinInput.value.trim());
    }
  });

  lockBtn.addEventListener('click', () => {
    currentPin = '';
    sessionStorage.removeItem('srishty_pin');
    clearInterval(pollInterval);
    authContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
    pinInput.value = '';
    pinInput.focus();
  });

  // Filter Buttons
  filterAllBtn.addEventListener('click', () => {
    currentFilter = 'all';
    sessionStorage.setItem('srishty_filter', 'all');
    updateFilterTabStyles();
    renderAttendeesList();
  });

  filterPendingBtn.addEventListener('click', () => {
    currentFilter = 'pending';
    sessionStorage.setItem('srishty_filter', 'pending');
    updateFilterTabStyles();
    renderAttendeesList();
  });

  filterApprovedBtn.addEventListener('click', () => {
    currentFilter = 'approved';
    sessionStorage.setItem('srishty_filter', 'approved');
    updateFilterTabStyles();
    renderAttendeesList();
  });

  filterRejectedBtn.addEventListener('click', () => {
    currentFilter = 'rejected';
    sessionStorage.setItem('srishty_filter', 'rejected');
    updateFilterTabStyles();
    renderAttendeesList();
  });

  searchInput.addEventListener('input', renderAttendeesList);

  manualRefreshBtn.addEventListener('click', () => {
    fetchAttendeesFromDatabase();
  });

  if (retryConnectionBtn) {
    retryConnectionBtn.addEventListener('click', () => {
      fetchAttendeesFromDatabase();
    });
  }
}

function updateFilterTabStyles() {
  const activeClass = 'py-1.5 px-2 rounded-lg bg-wine-700 text-white shadow-xs transition text-center truncate font-bold';
  const inactiveClass = 'py-1.5 px-2 rounded-lg text-wine-900 hover:bg-wine-100/60 transition text-center truncate font-bold';

  if (filterAllBtn) filterAllBtn.className = currentFilter === 'all' ? activeClass : inactiveClass;
  if (filterPendingBtn) filterPendingBtn.className = currentFilter === 'pending' ? activeClass : inactiveClass;
  if (filterApprovedBtn) filterApprovedBtn.className = currentFilter === 'approved' ? activeClass : inactiveClass;
  if (filterRejectedBtn) filterRejectedBtn.className = currentFilter === 'rejected' ? activeClass : inactiveClass;
}

// Authenticate Srishty
async function tryLogin(pin) {
  if (pin === '2026' || pin === '11011' || pin === ADMIN_PIN_DEFAULT || pin === 'admin') {
    currentPin = pin;
    sessionStorage.setItem('srishty_pin', pin);
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');

    await fetchAttendeesFromDatabase();

    // Start Real-Time Auto-Polling (checks SQLite DB every 3.5 seconds)
    clearInterval(pollInterval);
    pollInterval = setInterval(fetchAttendeesFromDatabase, 3500);
  } else {
    alert('Invalid PIN. Please enter Srishty’s Admin PIN (Default: 2026)');
  }
}

// Show/Hide Connection Error Banner
function showConnectionError(show) {
  if (connectionErrorBanner) {
    if (show) {
      connectionErrorBanner.classList.remove('hidden');
    } else {
      connectionErrorBanner.classList.add('hidden');
    }
  }
}

// Fetch all attendees from SQLite database
async function fetchAttendeesFromDatabase() {
  if (!currentPin) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/attendees?pin=${encodeURIComponent(currentPin)}`, {
      headers: {
        'x-admin-pin': currentPin
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Server returned an error`);
    }

    const data = await res.json();

    if (data.success) {
      showConnectionError(false);
      allAttendees = data.attendees || [];
      updateDashboardMetrics();
      renderAttendeesList();
    } else {
      console.error('Database fetch failed:', data.error);
      if (data.error && data.error.includes('Unauthorized')) {
        alert('Session expired or invalid PIN. Please log in again.');
        lockBtn.click();
      }
    }
  } catch (err) {
    console.error('Error connecting to backend database:', err);
    showConnectionError(true);
  }
}

// Update Top Metric Counters
function updateDashboardMetrics() {
  const pending = allAttendees.filter(a => a.status === 'PENDING');
  const approved = allAttendees.filter(a => a.status === 'APPROVED');
  const rejected = allAttendees.filter(a => a.status === 'REJECTED');

  const totalHeadcount = approved.reduce((sum, a) => sum + (a.quantity || 1), 0);
  const totalRevenue = approved.reduce((sum, a) => sum + (a.totalAmount || (a.quantity || 1) * 2000), 0);

  if (metricPending) metricPending.textContent = pending.length;
  if (metricApproved) metricApproved.textContent = approved.length;
  if (metricRejected) metricRejected.textContent = rejected.length;
  if (metricHeadcount) metricHeadcount.textContent = totalHeadcount;
  if (metricRevenue) metricRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

  if (filterAllCount) filterAllCount.textContent = allAttendees.length;
  if (filterPendingCount) filterPendingCount.textContent = pending.length;
  if (filterApprovedCount) filterApprovedCount.textContent = approved.length;
  if (filterRejectedCount) filterRejectedCount.textContent = rejected.length;
}

// Render filtered attendee cards from SQLite
function renderAttendeesList() {
  const query = (searchInput.value || '').toLowerCase().trim();

  // 1. Filter by search query
  let filtered = allAttendees;
  if (query) {
    filtered = filtered.filter(a =>
      (a.fullName && a.fullName.toLowerCase().includes(query)) ||
      (a.utrNumber && a.utrNumber.toLowerCase().includes(query)) ||
      (a.ticketId && a.ticketId.toLowerCase().includes(query)) ||
      (a.phone && a.phone.includes(query)) ||
      (a.companions && a.companions.some(c => c.name && c.name.toLowerCase().includes(query))) ||
      (a.song && a.song.toLowerCase().includes(query))
    );
  }

  attendeesListContainer.innerHTML = '';

  // 2. Tab: Pending Only
  if (currentFilter === 'pending') {
    const list = filtered.filter(a => a.status === 'PENDING');
    if (list.length === 0) {
      attendeesListContainer.innerHTML = `
        <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-[#dfcebc] text-xs text-zinc-500 space-y-1">
          <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-emerald-500 mb-2"></i>
          <p class="font-bold text-wine-950 text-sm">All caught up! No pending payments.</p>
          <p class="text-[11px] text-zinc-400">Database is active and listening for new student registrations.</p>
        </div>
      `;
    } else {
      list.forEach(item => attendeesListContainer.appendChild(createAttendeeCardElement(item)));
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // 3. Tab: Approved Only
  if (currentFilter === 'approved') {
    const list = filtered.filter(a => a.status === 'APPROVED');
    if (list.length === 0) {
      attendeesListContainer.innerHTML = `
        <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-[#dfcebc] text-xs text-zinc-500 space-y-1">
          <i data-lucide="ticket" class="w-8 h-8 mx-auto text-zinc-400 mb-2"></i>
          <p class="font-bold text-wine-950 text-sm">No approved passes yet.</p>
          <p class="text-[11px] text-zinc-400">Approved tickets will appear here with gate door check-in controls.</p>
        </div>
      `;
    } else {
      list.forEach(item => attendeesListContainer.appendChild(createAttendeeCardElement(item)));
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // 4. Tab: Rejected Only
  if (currentFilter === 'rejected') {
    const list = filtered.filter(a => a.status === 'REJECTED');
    if (list.length === 0) {
      attendeesListContainer.innerHTML = `
        <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-[#dfcebc] text-xs text-zinc-500 space-y-1">
          <i data-lucide="shield-check" class="w-8 h-8 mx-auto text-emerald-500 mb-2"></i>
          <p class="font-bold text-wine-950 text-sm">No rejected requests.</p>
          <p class="text-[11px] text-zinc-400">Declined student submissions will be tracked here with reasons.</p>
        </div>
      `;
    } else {
      list.forEach(item => attendeesListContainer.appendChild(createAttendeeCardElement(item)));
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // 5. Tab: ALL (Grouped and organized by status!)
  if (filtered.length === 0) {
    attendeesListContainer.innerHTML = `
      <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-[#dfcebc] text-xs text-zinc-500 space-y-1">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto text-zinc-400 mb-2"></i>
        <p class="font-bold text-wine-950 text-sm">
          ${query ? 'No registrations match your search.' : 'No attendees found in database.'}
        </p>
        <p class="text-[11px] text-zinc-400">Database is active and ready for registrations.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const pendingGroup = filtered.filter(a => a.status === 'PENDING');
  const approvedGroup = filtered.filter(a => a.status === 'APPROVED');
  const rejectedGroup = filtered.filter(a => a.status === 'REJECTED');

  // Render Section 1: Pending Approvals (Requires Srishty's confirmation)
  if (pendingGroup.length > 0) {
    const pendingSection = document.createElement('div');
    pendingSection.className = 'space-y-3';
    pendingSection.innerHTML = `
      <div class="flex items-center justify-between px-1 pt-1">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <h3 class="font-serif font-black text-xs sm:text-sm text-wine-950 uppercase tracking-wide">Pending Review & Approvals</h3>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          ${pendingGroup.length} Action Needed
        </span>
      </div>
      <div class="space-y-3" id="pendingCardsGroup"></div>
    `;
    const cardsContainer = pendingSection.querySelector('#pendingCardsGroup');
    pendingGroup.forEach(item => cardsContainer.appendChild(createAttendeeCardElement(item)));
    attendeesListContainer.appendChild(pendingSection);
  }

  // Render Section 2: Approved Passes (Official passes granted)
  if (approvedGroup.length > 0) {
    const approvedSection = document.createElement('div');
    approvedSection.className = `space-y-3 ${pendingGroup.length > 0 ? 'pt-3 border-t border-[#dfcebc]' : ''}`;
    approvedSection.innerHTML = `
      <div class="flex items-center justify-between px-1 pt-1">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 class="font-serif font-black text-xs sm:text-sm text-wine-950 uppercase tracking-wide">Approved Passes (Official Entry)</h3>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          ${approvedGroup.length} Verified
        </span>
      </div>
      <div class="space-y-3" id="approvedCardsGroup"></div>
    `;
    const cardsContainer = approvedSection.querySelector('#approvedCardsGroup');
    approvedGroup.forEach(item => cardsContainer.appendChild(createAttendeeCardElement(item)));
    attendeesListContainer.appendChild(approvedSection);
  }

  // Render Section 3: Rejected Requests (Declined with reasons)
  if (rejectedGroup.length > 0) {
    const rejectedSection = document.createElement('div');
    rejectedSection.className = `space-y-3 ${(pendingGroup.length > 0 || approvedGroup.length > 0) ? 'pt-3 border-t border-[#dfcebc]' : ''}`;
    rejectedSection.innerHTML = `
      <div class="flex items-center justify-between px-1 pt-1">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <h3 class="font-serif font-black text-xs sm:text-sm text-wine-950 uppercase tracking-wide">Rejected Requests</h3>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
          ${rejectedGroup.length} Declined
        </span>
      </div>
      <div class="space-y-3" id="rejectedCardsGroup"></div>
    `;
    const cardsContainer = rejectedSection.querySelector('#rejectedCardsGroup');
    rejectedGroup.forEach(item => cardsContainer.appendChild(createAttendeeCardElement(item)));
    attendeesListContainer.appendChild(rejectedSection);
  }

  if (window.lucide) window.lucide.createIcons();
}

// Helper: Build a single attendee card DOM element
function createAttendeeCardElement(item) {
  const isPending = item.status === 'PENDING';
  const isApproved = item.status === 'APPROVED';
  const isRejected = item.status === 'REJECTED';

  const card = document.createElement('div');
  card.className = `p-4 bg-white rounded-2xl border shadow-xs space-y-3 transition ${
    isPending ? 'border-amber-300 ring-2 ring-amber-200/70' :
    isRejected ? 'border-rose-300 bg-rose-50/20' :
    'border-[#e2d2c1]'
  }`;

  // Companions summary
  let companionsHtml = '';
  if (item.companions && item.companions.length > 0) {
    companionsHtml = `
      <div class="pt-2 border-t border-champagne-300/80 text-xs">
        <div class="font-bold text-wine-900 mb-1 flex items-center gap-1">
          <i data-lucide="users" class="w-3.5 h-3.5 text-wine-700"></i>
          <span>Accompanied Guests (${item.companions.length}):</span>
        </div>
        <div class="bg-champagne-50 p-2 rounded-xl border border-champagne-200 space-y-1 text-[11px]">
          ${item.companions.map((c, idx) => `
            <div class="flex justify-between items-center text-wine-950">
              <span>${idx + 1}. <strong>${c.name}</strong></span>
              <span class="text-zinc-500">${c.grade} • ${c.sec}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="flex items-start justify-between gap-2">
      <div>
        <div class="font-serif font-black text-base text-wine-950">${item.fullName}</div>
        <div class="text-xs text-wine-700 font-semibold">${item.classGrade} • ${item.section}</div>
      </div>
      <div class="text-right space-y-0.5">
        <span class="inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
          isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
          isRejected ? 'bg-rose-100 text-rose-800 border border-rose-300' :
          'bg-amber-100 text-amber-800 border border-amber-300'
        }">
          ${item.status}
        </span>
        ${item.checkedIn ? '<span class="block text-[8px] font-bold text-emerald-700 uppercase">DOOR CHECKED-IN</span>' : ''}
      </div>
    </div>

    <!-- Financial & Reference Box -->
    <div class="bg-champagne-50/80 p-2.5 rounded-xl text-xs space-y-1 font-mono text-[11px] border border-champagne-200">
      <div class="flex justify-between items-center">
        <span class="text-zinc-500 font-sans">Passes Count:</span>
        <strong class="text-wine-950 font-bold font-sans">${item.quantity || 1} Person(s)</strong>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-zinc-500 font-sans">Payment Due to Srishty:</span>
        <strong class="text-emerald-800 font-bold text-xs">₹${(item.totalAmount || (item.quantity || 1) * 2000).toLocaleString('en-IN')} (Exact)</strong>
      </div>
      <div class="flex justify-between items-center pt-1 border-t border-champagne-200/60">
        <span class="text-zinc-500 font-sans">Submitted UTR / Ref:</span>
        <div class="flex items-center gap-1">
          <strong class="text-wine-950 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 text-xs">${item.utrNumber}</strong>
          <button onclick="copyUtr('${item.utrNumber}')" class="text-[10px] text-wine-700 hover:text-wine-900 bg-white border border-champagne-300 px-1.5 py-0.5 rounded" title="Copy UTR">Copy</button>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-zinc-500 font-sans">Ticket Ref ID:</span>
        <span class="text-zinc-700">#${item.ticketId}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-zinc-500 font-sans">Phone / WhatsApp:</span>
        <a href="tel:${item.phone}" class="text-wine-800 font-bold hover:underline font-sans">${item.phone}</a>
      </div>
      ${item.instagram ? `
        <div class="flex justify-between items-center">
          <span class="text-zinc-500 font-sans">Instagram:</span>
          <span class="text-wine-700 font-sans">${item.instagram}</span>
        </div>
      ` : ''}
      ${item.song ? `
        <div class="flex justify-between items-center">
          <span class="text-zinc-500 font-sans">Song Request:</span>
          <span class="text-wine-900 font-sans italic truncate max-w-[200px]">"${item.song}"</span>
        </div>
      ` : ''}
      ${item.approvedBy ? `
        <div class="flex justify-between items-center pt-0.5 text-zinc-500 font-sans text-[10px]">
          <span>Approved By:</span>
          <span class="text-emerald-800 font-semibold">${item.approvedBy} (${new Date(item.approvedAt).toLocaleDateString()})</span>
        </div>
      ` : ''}
      ${item.rejectReason ? `
        <div class="pt-1 text-[10px] text-rose-700 border-t border-rose-200 font-sans">
          <strong>Rejection Reason:</strong> ${item.rejectReason}
        </div>
      ` : ''}
    </div>

    ${companionsHtml}

    <!-- Action Buttons Row -->
    <div class="flex items-center gap-2 pt-1">
      ${isPending ? `
        <button
          onclick="approveTicket('${item.ticketId}')"
          class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 active:scale-95"
        >
          <span>✅ Confirm & Approve (${item.quantity} Passes)</span>
        </button>
        <button
          onclick="rejectTicket('${item.ticketId}')"
          class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition active:scale-95"
        >
          Reject
        </button>
      ` : isApproved ? `
        <button
          onclick="toggleCheckIn('${item.ticketId}')"
          class="flex-1 py-1.5 ${item.checkedIn ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' : 'bg-wine-700 text-white hover:bg-wine-800'} rounded-xl text-xs font-bold transition active:scale-95"
        >
          ${item.checkedIn ? '✓ Door Checked-In (Tap to Undo)' : 'Mark Gate Door Check-In'}
        </button>
        <button
          onclick="revokeTicket('${item.ticketId}')"
          class="py-1.5 px-3 text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium"
          title="Reset ticket back to Pending review"
        >
          Reset to Pending
        </button>
      ` : `
        <button
          onclick="approveTicket('${item.ticketId}')"
          class="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-95"
        >
          Re-Approve Ticket
        </button>
        <button
          onclick="revokeTicket('${item.ticketId}')"
          class="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium"
        >
          Reset to Pending Review
        </button>
      `}

      <!-- WhatsApp Link -->
      <a
        href="https://api.whatsapp.com/send?phone=${item.phone.replace(/[^0-9]/g, '')}&text=Hi%20${encodeURIComponent(item.fullName)},%20this%20is%20Srishty%20regarding%20your%20December%20to%20Remember%20ticket%20(Ref:%20${item.ticketId})!"
        target="_blank"
        class="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition"
        title="Message Attendee on WhatsApp"
      >
        <i data-lucide="message-square" class="w-4 h-4"></i>
      </a>
    </div>
  `;

  return card;
}

// Copy UTR helper
window.copyUtr = function(utr) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(utr).then(() => {
      alert(`Copied UTR: ${utr}\nYou can now paste it into FamPay to verify payment.`);
    }).catch(() => {
      prompt('Copy UTR Number:', utr);
    });
  } else {
    prompt('Copy UTR Number:', utr);
  }
};

// Admin Action: Approve Ticket in Database
window.approveTicket = async function(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/approve/${encodeURIComponent(ticketId)}?pin=${encodeURIComponent(currentPin)}`, {
      method: 'POST',
      headers: {
        'x-admin-pin': currentPin
      }
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    } else {
      alert('Error approving ticket: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Failed to connect to database server. Please ensure node server.js is running.');
  }
};

// Admin Action: Reject Ticket in Database
window.rejectTicket = async function(ticketId) {
  const reason = prompt('Reason for rejection (e.g. UTR mismatch, payment not received in FamPay):', 'Payment verification failed');
  if (reason === null) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/reject/${encodeURIComponent(ticketId)}?pin=${encodeURIComponent(currentPin)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': currentPin
      },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    } else {
      alert('Error rejecting ticket: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Failed to connect to database server. Please ensure node server.js is running.');
  }
};

// Admin Action: Reset Ticket back to PENDING
window.revokeTicket = async function(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/revoke/${encodeURIComponent(ticketId)}?pin=${encodeURIComponent(currentPin)}`, {
      method: 'POST',
      headers: {
        'x-admin-pin': currentPin
      }
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    }
  } catch (err) {
    alert('Failed to connect to database server. Please ensure node server.js is running.');
  }
};

// Admin Action: Gate Door Check-In (toggle)
window.toggleCheckIn = async function(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/checkin/${encodeURIComponent(ticketId)}`, {
      method: 'POST',
      headers: {
        'x-admin-pin': currentPin
      }
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    } else {
      alert(data.error || 'Check-in failed');
    }
  } catch (err) {
    alert('Failed to connect to database server. Please ensure node server.js is running.');
  }
};
