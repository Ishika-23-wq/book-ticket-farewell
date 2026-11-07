/* ===================================================
   SRISHTY'S DEDICATED ADMIN PORTAL JS
   Connected directly to SQLite Database via REST API
=================================================== */

const ADMIN_PIN_DEFAULT = '11011';
let currentPin = sessionStorage.getItem('srishty_pin') || '';
let currentFilter = 'pending'; // 'pending' | 'approved' | 'all'
let allAttendees = [];
let pollInterval = null;

// DOM Elements
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const pinInput = document.getElementById('pinInput');
const loginBtn = document.getElementById('loginBtn');
const lockBtn = document.getElementById('lockBtn');

const metricPending = document.getElementById('metricPending');
const metricApproved = document.getElementById('metricApproved');
const metricHeadcount = document.getElementById('metricHeadcount');
const metricRevenue = document.getElementById('metricRevenue');

const filterPendingBtn = document.getElementById('filterPendingBtn');
const filterApprovedBtn = document.getElementById('filterApprovedBtn');
const filterAllBtn = document.getElementById('filterAllBtn');
const filterPendingCount = document.getElementById('filterPendingCount');
const filterApprovedCount = document.getElementById('filterApprovedCount');
const filterAllCount = document.getElementById('filterAllCount');

const searchInput = document.getElementById('searchInput');
const manualRefreshBtn = document.getElementById('manualRefreshBtn');
const attendeesListContainer = document.getElementById('attendeesListContainer');

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();

  setupEventListeners();

  // Auto-login if PIN stored in session
  if (currentPin) {
    tryLogin(currentPin);
  }
});

function setupEventListeners() {
  loginBtn.addEventListener('click', () => {
    const entered = pinInput.value.trim();
    tryLogin(entered);
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
  filterPendingBtn.addEventListener('click', () => {
    currentFilter = 'pending';
    updateFilterTabStyles();
    renderAttendeesList();
  });

  filterApprovedBtn.addEventListener('click', () => {
    currentFilter = 'approved';
    updateFilterTabStyles();
    renderAttendeesList();
  });

  filterAllBtn.addEventListener('click', () => {
    currentFilter = 'all';
    updateFilterTabStyles();
    renderAttendeesList();
  });

  searchInput.addEventListener('input', renderAttendeesList);

  manualRefreshBtn.addEventListener('click', () => {
    fetchAttendeesFromDatabase();
  });
}

function updateFilterTabStyles() {
  const activeClass = 'flex-1 py-1.5 rounded-lg bg-wine-700 text-white shadow-xs transition';
  const inactiveClass = 'flex-1 py-1.5 rounded-lg text-wine-900 transition';

  filterPendingBtn.className = currentFilter === 'pending' ? activeClass : inactiveClass;
  filterApprovedBtn.className = currentFilter === 'approved' ? activeClass : inactiveClass;
  filterAllBtn.className = currentFilter === 'all' ? activeClass : inactiveClass;
}

// Authenticate Srishty
async function tryLogin(pin) {
  if (pin === ADMIN_PIN_DEFAULT || pin === 'admin') {
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

// Fetch all attendees from SQLite database
async function fetchAttendeesFromDatabase() {
  if (!currentPin) return;

  try {
    const res = await fetch(`/api/admin/attendees?pin=${encodeURIComponent(currentPin)}`);
    const data = await res.json();

    if (data.success) {
      allAttendees = data.attendees || [];
      updateDashboardMetrics();
      renderAttendeesList();
    } else {
      console.error('Database fetch failed:', data.error);
    }
  } catch (err) {
    console.error('Error connecting to backend database:', err);
  }
}

// Update Top Metric Counters
function updateDashboardMetrics() {
  const pending = allAttendees.filter(a => a.status === 'PENDING');
  const approved = allAttendees.filter(a => a.status === 'APPROVED');

  const totalHeadcount = approved.reduce((sum, a) => sum + (a.quantity || 1), 0);
  const totalRevenue = approved.reduce((sum, a) => sum + (a.totalAmount || (a.quantity || 1) * 2000), 0);

  if (metricPending) metricPending.textContent = pending.length;
  if (metricApproved) metricApproved.textContent = approved.length;
  if (metricHeadcount) metricHeadcount.textContent = totalHeadcount;
  if (metricRevenue) metricRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

  if (filterPendingCount) filterPendingCount.textContent = pending.length;
  if (filterApprovedCount) filterApprovedCount.textContent = approved.length;
  if (filterAllCount) filterAllCount.textContent = allAttendees.length;
}

// Render filtered attendee cards from SQLite
function renderAttendeesList() {
  const query = (searchInput.value || '').toLowerCase().trim();

  let filtered = allAttendees;
  if (currentFilter === 'pending') {
    filtered = allAttendees.filter(a => a.status === 'PENDING');
  } else if (currentFilter === 'approved') {
    filtered = allAttendees.filter(a => a.status === 'APPROVED');
  }

  if (query) {
    filtered = filtered.filter(a =>
      a.fullName.toLowerCase().includes(query) ||
      (a.utrNumber && a.utrNumber.toLowerCase().includes(query)) ||
      a.ticketId.toLowerCase().includes(query) ||
      a.phone.includes(query) ||
      (a.companions && a.companions.some(c => c.name.toLowerCase().includes(query)))
    );
  }

  attendeesListContainer.innerHTML = '';

  if (filtered.length === 0) {
    attendeesListContainer.innerHTML = `
      <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-[#dfcebc] text-xs text-zinc-500 space-y-1">
        <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-emerald-500 mb-2"></i>
        <p class="font-bold text-wine-950 text-sm">
          ${currentFilter === 'pending' ? 'All caught up! No pending payments.' : 'No attendees found.'}
        </p>
        <p class="text-[11px] text-zinc-400">Database is active and listening for new registrations.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  filtered.forEach(item => {
    const isPending = item.status === 'PENDING';
    const isApproved = item.status === 'APPROVED';
    const isRejected = item.status === 'REJECTED';

    const card = document.createElement('div');
    card.className = `p-4 bg-white rounded-2xl border shadow-xs space-y-3 transition ${
      isPending ? 'border-amber-300 ring-2 ring-amber-200/70' :
      isRejected ? 'border-rose-300 bg-rose-50/20' :
      'border-[#e2d2c1]'
    }`;

    // Companions Summary list
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
          <strong class="text-emerald-800 font-bold text-xs">₹${item.totalAmount.toLocaleString('en-IN')} (Exact)</strong>
        </div>
        <div class="flex justify-between items-center pt-1 border-t border-champagne-200/60">
          <span class="text-zinc-500 font-sans">Submitted UTR / Ref:</span>
          <strong class="text-wine-950 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 text-xs">${item.utrNumber}</strong>
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
            class="flex-1 py-1.5 ${item.checkedIn ? 'bg-zinc-200 text-zinc-700' : 'bg-wine-700 text-white'} rounded-xl text-xs font-bold transition active:scale-95"
          >
            ${item.checkedIn ? 'Checked-In at Door' : 'Mark Gate Check-In'}
          </button>
          <button
            onclick="revokeTicket('${item.ticketId}')"
            class="py-1.5 px-3 text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium"
          >
            Reset to Pending
          </button>
        ` : `
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

    attendeesListContainer.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Admin Action: Approve Ticket in Database
window.approveTicket = async function(ticketId) {
  try {
    const res = await fetch(`/api/admin/approve/${encodeURIComponent(ticketId)}?pin=${encodeURIComponent(currentPin)}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    } else {
      alert('Error approving ticket: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Failed to connect to database server.');
  }
};

// Admin Action: Reject Ticket in Database
window.rejectTicket = async function(ticketId) {
  const reason = prompt('Reason for rejection (e.g. UTR mismatch, payment not received in FamPay):', 'Payment verification failed');
  if (reason === null) return;

  try {
    const res = await fetch(`/api/admin/reject/${encodeURIComponent(ticketId)}?pin=${encodeURIComponent(currentPin)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    } else {
      alert('Error rejecting ticket: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Failed to connect to database server.');
  }
};

// Admin Action: Reset Ticket back to PENDING
window.revokeTicket = async function(ticketId) {
  try {
    const res = await fetch(`/api/admin/revoke/${encodeURIComponent(ticketId)}?pin=${encodeURIComponent(currentPin)}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    }
  } catch (err) {
    alert('Failed to connect to database server.');
  }
};

// Admin Action: Gate Door Check-In
window.toggleCheckIn = async function(ticketId) {
  try {
    const res = await fetch(`/api/admin/checkin/${encodeURIComponent(ticketId)}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      await fetchAttendeesFromDatabase();
    } else {
      alert(data.error || 'Check-in failed');
    }
  } catch (err) {
    alert('Failed to connect to database server.');
  }
};
