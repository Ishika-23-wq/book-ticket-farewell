/* ===================================================
   DECEMBER TO REMEMBER - CLASS 10TH FAREWELL MOBILE APP
   - Backend SQLite Database Sync via REST API
   - Strict Srishty Approval: Passes & QR locked until approved
   - Always-visible Dynamic Amount-Locked FamPay QR (am=XXXX.00)
   - Dynamic Accompanied Guest Registration (₹2,000 per person)
=================================================== */

// Global State
const PASS_PRICE = 2000;
const SRISHTY_UPI = '9592982012@fam';
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000'))
  ? 'http://localhost:3000'
  : '';
let passQuantity = 1;
let qrcodeInstance = null;
let srishtyDynamicQrInstance = null;
let statusPollInterval = null;

// Target Event Date: December 23, 2026 18:00:00 (6:00 PM)
const EVENT_DATE = new Date('2026-12-23T18:00:00+05:30').getTime();

// Storage Key
const STORAGE_CURRENT_TICKET = 'dtr_current_ticket';

// DOM Elements - Form
const form = document.getElementById('bookingForm');
const fullNameInput = document.getElementById('fullName');
const classGradeInput = document.getElementById('classGrade');
const sectionInput = document.getElementById('section');
const phoneInput = document.getElementById('phoneNumber');
const instagramInput = document.getElementById('instagramHandle');
const djSongInput = document.getElementById('djSong');
const utrNumberInput = document.getElementById('utrNumber');
const submitBtn = document.getElementById('submitBtn');

// Pass Counter & Dynamic Companions
const decreasePassesBtn = document.getElementById('decreasePasses');
const increasePassesBtn = document.getElementById('increasePasses');
const passCountEl = document.getElementById('passCount');
const companionsSection = document.getElementById('companionsSection');
const companionsInputsList = document.getElementById('companionsInputsList');

// Payment Amount & Dynamic UPI Controls
const subPaymentSubtitle = document.getElementById('subPaymentSubtitle');
const payLockedAmountBadge = document.getElementById('payLockedAmountBadge');
const upiPayLinkBtn = document.getElementById('upiPayLinkBtn');
const upiPayBtnText = document.getElementById('upiPayBtnText');
const upiLockedNote = document.getElementById('upiLockedNote');
const copyUpiBtn = document.getElementById('copyUpiBtn');
const copyUpiLabel = document.getElementById('copyUpiLabel');

const paymentAmountInput = document.getElementById('paymentAmount');
const fixedAmountLabel = document.getElementById('fixedAmountLabel');
const amountErrorMsg = document.getElementById('amountErrorMsg');

// Srishty Amount-Locked Dynamic QR (Permanently Visible)
const lockedQrContainer = document.getElementById('lockedQrContainer');
const qrLockedBadgeText = document.getElementById('qrLockedBadgeText');
const qrScanHelpText = document.getElementById('qrScanHelpText');
const srishtyDynamicQr = document.getElementById('srishtyDynamicQr');

// Panels & Tab Navigation
const registerPanel = document.getElementById('registerPanel');
const ticketPanel = document.getElementById('ticketPanel');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const tabTicketBtn = document.getElementById('tabTicketBtn');
const viewMyTicketBtn = document.getElementById('viewMyTicketBtn');
const goToRegisterBtn = document.getElementById('goToRegisterBtn');
const editDetailsBtn = document.getElementById('editDetailsBtn');

// Ticket States
const emptyTicketState = document.getElementById('emptyTicketState');
const pendingTicketState = document.getElementById('pendingTicketState');
const rejectedTicketState = document.getElementById('rejectedTicketState');
const approvedTicketState = document.getElementById('approvedTicketState');

// Pending State Elements
const pendingGuestName = document.getElementById('pendingGuestName');
const pendingGradeSec = document.getElementById('pendingGradeSec');
const pendingCompanionsRow = document.getElementById('pendingCompanionsRow');
const pendingCompanionsText = document.getElementById('pendingCompanionsText');
const pendingAmountText = document.getElementById('pendingAmountText');
const pendingUtr = document.getElementById('pendingUtr');
const pendingRefId = document.getElementById('pendingRefId');
const notifySrishtyBtn = document.getElementById('notifySrishtyBtn');
const refreshStatusBtn = document.getElementById('refreshStatusBtn');

// Rejected State Elements
const rejectReasonText = document.getElementById('rejectReasonText');
const rejectedGuestName = document.getElementById('rejectedGuestName');
const rejectedUtr = document.getElementById('rejectedUtr');
const rejectedRefId = document.getElementById('rejectedRefId');
const contactSrishtyAfterRejectBtn = document.getElementById('contactSrishtyAfterRejectBtn');
const reapplyBtn = document.getElementById('reapplyBtn');

// Approved Ticket Card Elements
const passRefId = document.getElementById('passRefId');
const passGuestName = document.getElementById('passGuestName');
const passGradeSec = document.getElementById('passGradeSec');
const passCompanionsBox = document.getElementById('passCompanionsBox');
const passCompanionsCount = document.getElementById('passCompanionsCount');
const passCompanionsListText = document.getElementById('passCompanionsListText');
const passQuantityEl = document.getElementById('passQuantity');
const passPaidRate = document.getElementById('passPaidRate');
const passUtrDisplay = document.getElementById('passUtrDisplay');
const passBarcodeText = document.getElementById('passBarcodeText');
const checkInBadge = document.getElementById('checkInBadge');
const qrCodeContainer = document.getElementById('qrcode');
const downloadPassBtn = document.getElementById('downloadPassBtn');
const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');

// Poster Modal Elements
const openPosterBtn = document.getElementById('openPosterBtn');
const posterModal = document.getElementById('posterModal');
const closePosterBtn = document.getElementById('closePosterBtn');
const closePosterBtn2 = document.getElementById('closePosterBtn2');

// Footer Nav
const navHomeBtn = document.getElementById('navHomeBtn');
const navBookBtn = document.getElementById('navBookBtn');
const navPassBtn = document.getElementById('navPassBtn');

// ==============================================
// INITIALIZATION
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initCountdown();
  setupEventListeners();
  updatePassQuantityUI(); // Inits dynamic amount-locked QR code immediately
  loadSavedTicket(); // Checks SQLite DB for live status of existing registration
  initDecemberTripleTapAdmin(); // Secret triple-tap on December theme lands on admin page
});

// Setup Event Listeners
function setupEventListeners() {
  // Pass Counter (+/- buttons)
  if (decreasePassesBtn) {
    decreasePassesBtn.addEventListener('click', () => {
      if (passQuantity > 1) {
        passQuantity--;
        updatePassQuantityUI();
      }
    });
  }

  if (increasePassesBtn) {
    increasePassesBtn.addEventListener('click', () => {
      if (passQuantity < 5) {
        passQuantity++;
        updatePassQuantityUI();
      } else {
        alert('Maximum 5 passes can be booked in a single registration. For larger groups, please submit an additional booking!');
      }
    });
  }

  // Copy UPI ID
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(SRISHTY_UPI).then(() => {
        if (copyUpiLabel) copyUpiLabel.textContent = 'Copied!';
        setTimeout(() => {
          if (copyUpiLabel) copyUpiLabel.textContent = 'Copy ID';
        }, 2000);
      }).catch(() => {
        prompt('Copy Srishty UPI ID:', SRISHTY_UPI);
      });
    });
  }

  // Tab switching
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchTab('register'));
  if (tabTicketBtn) tabTicketBtn.addEventListener('click', () => switchTab('ticket'));
  if (viewMyTicketBtn) viewMyTicketBtn.addEventListener('click', () => switchTab('ticket'));
  if (goToRegisterBtn) goToRegisterBtn.addEventListener('click', () => switchTab('register'));
  if (editDetailsBtn) editDetailsBtn.addEventListener('click', () => switchTab('register'));

  // Pending State Actions
  if (notifySrishtyBtn) notifySrishtyBtn.addEventListener('click', notifySrishtyOnWhatsApp);
  if (refreshStatusBtn) refreshStatusBtn.addEventListener('click', handleRefreshStatus);

  // Rejected State Actions
  if (contactSrishtyAfterRejectBtn) contactSrishtyAfterRejectBtn.addEventListener('click', contactSrishtyAfterReject);
  if (reapplyBtn) reapplyBtn.addEventListener('click', handleReapply);

  // Approved Ticket Actions
  if (downloadPassBtn) downloadPassBtn.addEventListener('click', downloadTicketAsImage);
  if (shareWhatsAppBtn) shareWhatsAppBtn.addEventListener('click', shareOnWhatsApp);

  // Footer nav
  if (navHomeBtn) navHomeBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  if (navBookBtn) navBookBtn.addEventListener('click', () => switchTab('register'));
  if (navPassBtn) navPassBtn.addEventListener('click', () => switchTab('ticket'));

  // Form submit
  if (form) form.addEventListener('submit', handleFormSubmit);

  // Poster Modal
  if (openPosterBtn) openPosterBtn.addEventListener('click', () => posterModal && posterModal.classList.remove('hidden'));
  if (closePosterBtn) closePosterBtn.addEventListener('click', () => posterModal && posterModal.classList.add('hidden'));
  if (closePosterBtn2) closePosterBtn2.addEventListener('click', () => posterModal && posterModal.classList.add('hidden'));
}

// ==============================================
// PASS COUNT, AMOUNT LOCKING & COMPANIONS
// ==============================================
function updatePassQuantityUI() {
  const totalAmount = passQuantity * PASS_PRICE;
  const formattedTotal = `₹${totalAmount.toLocaleString('en-IN')}`;

  // Update Counter Display
  if (passCountEl) passCountEl.textContent = passQuantity;

  // Update Payment Details
  if (subPaymentSubtitle) {
    subPaymentSubtitle.textContent = `Exact ${formattedTotal} payment required (${passQuantity} ${passQuantity === 1 ? 'person' : 'people'})`;
  }
  if (payLockedAmountBadge) {
    payLockedAmountBadge.textContent = `🔒 Total: ${formattedTotal} Locked`;
  }
  if (upiPayBtnText) {
    upiPayBtnText.textContent = `Tap to Pay ${formattedTotal} via UPI (GPay / PhonePe / Paytm)`;
  }
  if (upiPayLinkBtn) {
    upiPayLinkBtn.href = `upi://pay?pa=${encodeURIComponent(SRISHTY_UPI)}&pn=Srishty&am=${totalAmount}.00&cu=INR&tn=December%20To%20Remember%20Pass%20Fee`;
  }
  if (upiLockedNote) {
    upiLockedNote.innerHTML = `Opens your payment app with the amount <strong>automatically locked to ${formattedTotal}</strong>.`;
  }
  if (fixedAmountLabel) {
    fixedAmountLabel.textContent = `Fixed at ${formattedTotal} (${passQuantity} ${passQuantity === 1 ? 'Person' : 'Persons'})`;
  }
  if (paymentAmountInput) {
    paymentAmountInput.value = totalAmount;
  }
  if (qrLockedBadgeText) {
    qrLockedBadgeText.textContent = `Pre-set Amount: ${formattedTotal} (Non-editable)`;
  }
  if (qrScanHelpText) {
    qrScanHelpText.innerHTML = `Scanning this QR code with Google Pay, PhonePe, or Paytm automatically fixes the payment to <strong>strictly ${formattedTotal}</strong>.`;
  }

  // Update Always-Visible Dynamic Amount-Locked FamPay QR
  initSrishtyLockedQr(totalAmount);

  // Manage Accompanying Companion Inputs
  renderCompanionInputs();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Generate companion input rows dynamically when passQuantity > 1
function renderCompanionInputs() {
  if (!companionsSection || !companionsInputsList) return;

  if (passQuantity <= 1) {
    companionsSection.classList.add('hidden');
    companionsInputsList.innerHTML = '';
    return;
  }

  companionsSection.classList.remove('hidden');

  // Preserve already entered values
  const currentValues = [];
  const existingRows = companionsInputsList.querySelectorAll('.companion-row');
  existingRows.forEach(row => {
    const nameInput = row.querySelector('.companion-name');
    const classSelect = row.querySelector('.companion-class');
    const secSelect = row.querySelector('.companion-sec');
    if (nameInput) {
      currentValues.push({
        name: nameInput.value,
        grade: classSelect ? classSelect.value : 'Class 10th',
        sec: secSelect ? secSelect.value : 'Section A'
      });
    }
  });

  companionsInputsList.innerHTML = '';

  const neededCompanions = passQuantity - 1; // e.g. 2 passes = 1 companion (Guest #2)

  for (let i = 0; i < neededCompanions; i++) {
    const guestNumber = i + 2;
    const prev = currentValues[i] || { name: '', grade: 'Class 10th', sec: 'Section A' };

    const guestCard = document.createElement('div');
    guestCard.className = 'companion-row p-3 bg-white/95 rounded-xl border border-[#e5d4c2] shadow-xs space-y-2';

    guestCard.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-wine-900 flex items-center gap-1.5">
          <span class="w-4 h-4 rounded-full bg-wine-700 text-gold-300 flex items-center justify-center text-[10px] font-mono">
            ${guestNumber}
          </span>
          <span>Guest #${guestNumber} Details *</span>
        </span>
        <span class="text-[10px] text-zinc-400">Class 10th Attendee</span>
      </div>

      <div>
        <input
          type="text"
          required
          placeholder="Companion #${guestNumber} Full Name"
          value="${prev.name}"
          class="companion-name w-full px-3 py-2 bg-champagne-50/70 border border-[#dbcaa7] rounded-xl text-xs text-wine-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-wine-600"
        />
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <select class="companion-class px-2.5 py-1.5 bg-champagne-50/70 border border-[#dbcaa7] rounded-xl text-xs text-wine-900 focus:outline-none focus:ring-2 focus:ring-wine-600">
          <option value="Class 10th" ${prev.grade === 'Class 10th' ? 'selected' : ''}>Class 10th</option>
          <option value="Class 10th Alumni" ${prev.grade === 'Class 10th Alumni' ? 'selected' : ''}>Class 10th Alumni</option>
          <option value="Special Guest" ${prev.grade === 'Special Guest' ? 'selected' : ''}>Special Guest</option>
        </select>
        <select class="companion-sec px-2.5 py-1.5 bg-champagne-50/70 border border-[#dbcaa7] rounded-xl text-xs text-wine-900 focus:outline-none focus:ring-2 focus:ring-wine-600">
          <option value="Section A" ${prev.sec === 'Section A' ? 'selected' : ''}>Section A</option>
          <option value="Section B" ${prev.sec === 'Section B' ? 'selected' : ''}>Section B</option>
          <option value="Section C" ${prev.sec === 'Section C' ? 'selected' : ''}>Section C</option>
          <option value="Section D" ${prev.sec === 'Section D' ? 'selected' : ''}>Section D</option>
          <option value="Section E" ${prev.sec === 'Section E' ? 'selected' : ''}>Section E</option>
          <option value="Other" ${prev.sec === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    `;

    companionsInputsList.appendChild(guestCard);
  }
}

// Dynamic Srishty UPI QR Code with pre-locked total amount (Permanently Visible)
function initSrishtyLockedQr(amount = 2000) {
  if (!srishtyDynamicQr) return;
  srishtyDynamicQr.innerHTML = '';
  // NPCI standard UPI URI with amount parameter am=XXXX.00
  const lockedUpiUri = `upi://pay?pa=${encodeURIComponent(SRISHTY_UPI)}&pn=Srishty&am=${amount}.00&cu=INR&tn=December%20To%20Remember%20Pass%20Fee`;
  try {
    srishtyDynamicQrInstance = new QRCode(srishtyDynamicQr, {
      text: lockedUpiUri,
      width: 140,
      height: 140,
      colorDark: "#1a0508",
      colorLight: "#FAF6F0",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (err) {
    console.error('Failed to create Srishty dynamic QR:', err);
    srishtyDynamicQr.innerHTML = '<span class="text-xs text-wine-800 font-mono">Scan on UPI App</span>';
  }
}

// ==============================================
// TAB SWITCHING & TICKET STATE RENDERING
// ==============================================
function switchTab(tab) {
  if (tab === 'register') {
    registerPanel.classList.remove('hidden');
    ticketPanel.classList.add('hidden');

    tabRegisterBtn.classList.add('bg-wine-700', 'text-white', 'shadow-sm');
    tabRegisterBtn.classList.remove('text-wine-900');
    tabTicketBtn.classList.remove('bg-wine-700', 'text-white', 'shadow-sm');
    tabTicketBtn.classList.add('text-wine-900');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  } else {
    registerPanel.classList.add('hidden');
    ticketPanel.classList.remove('hidden');

    tabTicketBtn.classList.add('bg-wine-700', 'text-white', 'shadow-sm');
    tabTicketBtn.classList.remove('text-wine-900');
    tabRegisterBtn.classList.remove('bg-wine-700', 'text-white', 'shadow-sm');
    tabRegisterBtn.classList.add('text-wine-900');

    renderTicketPanelState();
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render the appropriate state inside Ticket Panel
function renderTicketPanelState() {
  const ticket = getStoredCurrentTicket();

  emptyTicketState.classList.add('hidden');
  pendingTicketState.classList.add('hidden');
  rejectedTicketState.classList.add('hidden');
  approvedTicketState.classList.add('hidden');

  if (!ticket) {
    emptyTicketState.classList.remove('hidden');
    return;
  }

  // 1. PENDING STATE: Ticket Pass is 100% hidden!
  if (ticket.status === 'PENDING') {
    pendingTicketState.classList.remove('hidden');
    pendingGuestName.textContent = ticket.fullName;
    pendingGradeSec.textContent = `${ticket.classGrade} • ${ticket.section}`;
    pendingUtr.textContent = ticket.utrNumber || 'N/A';
    pendingRefId.textContent = `#${ticket.ticketId}`;
    if (pendingAmountText) {
      pendingAmountText.textContent = `₹${ticket.totalAmount.toLocaleString('en-IN')} (${ticket.quantity} Passes)`;
    }

    if (pendingCompanionsRow) {
      if (ticket.companions && ticket.companions.length > 0) {
        pendingCompanionsRow.classList.remove('hidden');
        pendingCompanionsText.textContent = ticket.companions.map(c => c.name).join(', ');
      } else {
        pendingCompanionsRow.classList.add('hidden');
      }
    }

    // Start live polling if not already polling
    startStatusPolling(ticket.ticketId);
  }
  // 2. REJECTED STATE: Ticket Pass is 100% hidden!
  else if (ticket.status === 'REJECTED') {
    stopStatusPolling();
    rejectedTicketState.classList.remove('hidden');
    rejectReasonText.textContent = ticket.rejectReason || 'Payment verification failed or UTR does not match bank records.';
    rejectedGuestName.textContent = ticket.fullName;
    rejectedUtr.textContent = ticket.utrNumber || 'N/A';
    rejectedRefId.textContent = `#${ticket.ticketId}`;
  }
  // 3. APPROVED STATE: The ONLY state where the cinema pass & QR code are displayed!
  else if (ticket.status === 'APPROVED') {
    stopStatusPolling();
    approvedTicketState.classList.remove('hidden');
    renderApprovedTicket(ticket);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render Approved Cinema Ticket with dynamic QR Code
function renderApprovedTicket(ticket) {
  passRefId.textContent = `#${ticket.ticketId}`;
  passGuestName.textContent = ticket.fullName;
  passGradeSec.textContent = `${ticket.classGrade} • ${ticket.section}`;
  passUtrDisplay.textContent = ticket.utrNumber || 'N/A';
  passBarcodeText.textContent = `${ticket.ticketId}-LUDHIANA-VIP`;

  if (passQuantityEl) {
    passQuantityEl.textContent = `${ticket.quantity} ${ticket.quantity === 1 ? 'Person' : 'Persons'}`;
  }
  if (passPaidRate) {
    passPaidRate.textContent = `₹${ticket.totalAmount.toLocaleString('en-IN')}`;
  }

  // Display Accompanied Guests on the Pass
  if (passCompanionsBox) {
    if (ticket.companions && ticket.companions.length > 0) {
      passCompanionsBox.classList.remove('hidden');
      if (passCompanionsCount) passCompanionsCount.textContent = ticket.companions.length;
      if (passCompanionsListText) {
        passCompanionsListText.textContent = ticket.companions.map((c, i) => `${i + 1}. ${c.name} (${c.grade} • ${c.sec})`).join('  |  ');
      }
    } else {
      passCompanionsBox.classList.add('hidden');
    }
  }

  if (ticket.checkedIn) {
    checkInBadge.textContent = 'STATUS: CHECKED IN AT DOOR';
    checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else {
    checkInBadge.textContent = 'STATUS: ADMIT GRANTED';
    checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-wine-100 text-wine-800 border border-wine-300';
  }

  // Generate Scannable QR Payload (Includes primary + companions)
  const qrPayload = JSON.stringify({
    id: ticket.ticketId,
    name: ticket.fullName,
    grade: ticket.classGrade,
    sec: ticket.section,
    passes: ticket.quantity,
    companions: (ticket.companions || []).map(c => c.name),
    totalAmount: ticket.totalAmount,
    utr: ticket.utrNumber,
    approvedBy: "Srishty",
    status: "VALID_ENTRY",
    event: "December to Remember",
    venue: "Pyramid Lounge",
    date: "2026-12-23"
  });

  generateQRCode(qrPayload);
}

// QR Code generator
function generateQRCode(text) {
  qrCodeContainer.innerHTML = '';
  try {
    qrcodeInstance = new QRCode(qrCodeContainer, {
      text: text,
      width: 96,
      height: 96,
      colorDark: "#3E0811",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    qrCodeContainer.innerHTML = `<span class="text-xs text-wine-700 font-mono">${text}</span>`;
  }
}

// ==============================================
// FORM SUBMISSION & BACKEND REST API CALL
// ==============================================
async function handleFormSubmit(e) {
  e.preventDefault();

  const fullName = fullNameInput.value.trim();
  const classGrade = classGradeInput.value;
  const section = sectionInput.value;
  const phone = phoneInput.value.trim();
  const instagram = instagramInput.value.trim() ? `@${instagramInput.value.replace(/^@/, '')}` : '';
  const song = djSongInput.value.trim();
  const utr = utrNumberInput.value.trim();

  if (!fullName || !phone) {
    alert('Please fill in your primary name and phone number.');
    return;
  }

  // Collect and validate accompanying companion details
  const companions = [];
  if (passQuantity > 1) {
    const rows = companionsInputsList.querySelectorAll('.companion-row');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cNameInput = row.querySelector('.companion-name');
      const cGradeSelect = row.querySelector('.companion-class');
      const cSecSelect = row.querySelector('.companion-sec');

      const cName = cNameInput ? cNameInput.value.trim() : '';
      if (!cName) {
        alert(`Please enter the full name for Accompanying Guest #${i + 2}.`);
        if (cNameInput) cNameInput.focus();
        return;
      }

      companions.push({
        name: cName,
        grade: cGradeSelect ? cGradeSelect.value : 'Class 10th',
        sec: cSecSelect ? cSecSelect.value : 'Section A'
      });
    }
  }

  if (!utr) {
    const expected = passQuantity * PASS_PRICE;
    alert(`Please enter the 12-digit UPI UTR / Transaction Reference number after paying ₹${expected.toLocaleString('en-IN')} to Srishty.`);
    utrNumberInput.focus();
    return;
  }

  // Generate unique Ticket ID
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `DTR-2026-X${randomNum}`;
  const totalAmount = passQuantity * PASS_PRICE;

  const payload = {
    ticketId,
    fullName,
    classGrade,
    section,
    phone,
    instagram,
    song,
    quantity: passQuantity,
    companions,
    totalAmount,
    utrNumber: utr
  };

  // Submit button loading state
  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="inline-block animate-spin mr-1.5">⏳</span>
    <span>Saving to Srishty's Database...</span>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to submit registration');
    }

    const savedTicket = result.ticket;

    // Save ticket locally so user can check status anytime
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(savedTicket));

    // Switch to ticket view (will display PENDING state, pass strictly hidden)
    switchTab('ticket');
    viewMyTicketBtn.classList.remove('hidden');

    // Start live polling for Srishty's approval
    startStatusPolling(savedTicket.ticketId);

    setTimeout(() => {
      alert(`🎉 Registration details saved in Database!\n\nYour ₹${totalAmount.toLocaleString('en-IN')} payment (${passQuantity} Passes, UTR: ${utr}) is now with Srishty for confirmation.\n\nYour pass unlocks once Srishty approves! Tap "Send Payment Details to Srishty on WhatsApp" to notify her.`);
    }, 350);

  } catch (err) {
    console.error('Registration submission error:', err);
    alert(`⚠️ Error submitting registration: ${err.message}\n\nPlease try again or contact Srishty directly.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    if (window.lucide) window.lucide.createIcons();
  }
}

// ==============================================
// REAL-TIME DATABASE POLLING & STATUS REFRESH
// ==============================================
function startStatusPolling(ticketId) {
  stopStatusPolling();

  statusPollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ticket/${encodeURIComponent(ticketId)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success || !data.ticket) return;

      const updated = data.ticket;
      const current = getStoredCurrentTicket();

      // Check if status changed
      if (current && current.status !== updated.status) {
        localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(updated));
        renderTicketPanelState();

        if (updated.status === 'APPROVED') {
          stopStatusPolling();
          triggerConfetti();
          alert(`🎉 Congratulations ${updated.fullName}!\n\nSrishty has verified and APPROVED your payment of ₹${updated.totalAmount.toLocaleString('en-IN')} (${updated.quantity} Passes)!\n\nYour official VIP Movie Pass with Entry QR Code is now unlocked.`);
        } else if (updated.status === 'REJECTED') {
          stopStatusPolling();
          alert(`⚠️ Srishty could not approve your payment.\nReason: ${updated.rejectReason || 'Verification failed'}`);
        }
      }
    } catch (err) {
      console.warn('Polling status check failed:', err);
    }
  }, 3500); // Check database every 3.5 seconds
}

function stopStatusPolling() {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
}

// Manual Check / Refresh Approval Status button
async function handleRefreshStatus() {
  const current = getStoredCurrentTicket();
  if (!current) return;

  const originalContent = refreshStatusBtn.innerHTML;
  refreshStatusBtn.disabled = true;
  refreshStatusBtn.innerHTML = `
    <span class="inline-block animate-spin mr-1">⏳</span>
    <span>Querying Srishty's Database...</span>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/ticket/${encodeURIComponent(current.ticketId)}`);
    if (!res.ok) throw new Error('Ticket not found in database');

    const data = await res.json();
    if (!data.success || !data.ticket) throw new Error('Invalid ticket response');

    const fresh = data.ticket;
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(fresh));
    renderTicketPanelState();

    if (fresh.status === 'APPROVED') {
      triggerConfetti();
      alert(`🎉 Congratulations ${fresh.fullName}!\n\nSrishty has verified and APPROVED your payment of ₹${fresh.totalAmount.toLocaleString('en-IN')} (${fresh.quantity} Passes)!\nYour official VIP Movie Pass is unlocked.`);
    } else if (fresh.status === 'REJECTED') {
      alert(`⚠️ Srishty has rejected this payment.\nReason: ${fresh.rejectReason || 'Verification failed'}`);
    } else {
      alert("⏳ Status: Still Awaiting Srishty's Approval.\n\nSrishty has not reviewed this submission yet in her Admin Portal. Please tap 'Send Payment Details on WhatsApp' to ping her directly!");
    }
  } catch (err) {
    console.error('Refresh error:', err);
    alert('Unable to connect to the database right now. Please check your internet connection and try again.');
  } finally {
    refreshStatusBtn.disabled = false;
    refreshStatusBtn.innerHTML = originalContent;
    if (window.lucide) window.lucide.createIcons();
  }
}

// Send WhatsApp payment confirmation to Srishty
function notifySrishtyOnWhatsApp() {
  const current = getStoredCurrentTicket();
  if (!current) return;

  let companionsInfo = '';
  if (current.companions && current.companions.length > 0) {
    companionsInfo = `%0A👥 *Accompanying Guests (${current.companions.length}):* ` + current.companions.map(c => `${c.name} (${c.grade}-${c.sec})`).join(', ');
  }

  const msg = `👑 *Payment Confirmation for Srishty* 👑%0A%0A` +
    `Hi Srishty! I have registered for *December to Remember (Class 10th Farewell Party)*.%0A%0A` +
    `👤 *Primary Attendee:* ${current.fullName} (${current.classGrade} - ${current.section})%0A` +
    `🎟️ *Passes Count:* ${current.quantity} Person(s)` + companionsInfo + `%0A` +
    `📱 *Phone:* ${current.phone}%0A` +
    `💳 *UTR / Ref:* ${current.utrNumber}%0A` +
    `💵 *Total Paid:* ₹${current.totalAmount.toLocaleString('en-IN')} (Exact)%0A` +
    `🎟️ *Ticket ID:* #${current.ticketId}%0A%0A` +
    `Please approve our VIP pass in your Admin Portal! ✨`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// Contact Srishty after Rejection
function contactSrishtyAfterReject() {
  const current = getStoredCurrentTicket();
  if (!current) return;

  const msg = `Hi Srishty, my registration for December to Remember was marked as Rejected.%0A%0A` +
    `👤 *Name:* ${current.fullName}%0A` +
    `🎟️ *Ref:* #${current.ticketId}%0A` +
    `💳 *UTR:* ${current.utrNumber}%0A` +
    `💵 *Amount:* ₹${current.totalAmount}%0A%0A` +
    `Could you please check my transaction receipt? Here is my screenshot. Thank you!`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// Re-apply / correct submission
function handleReapply() {
  const current = getStoredCurrentTicket();
  if (current) {
    fullNameInput.value = current.fullName || '';
    phoneInput.value = current.phone || '';
    if (current.instagram) instagramInput.value = current.instagram.replace(/^@/, '');
    utrNumberInput.value = '';
    passQuantity = current.quantity || 1;
    updatePassQuantityUI();
  }
  switchTab('register');
  utrNumberInput.focus();
}

// Download Ticket as high-resolution PNG image
function downloadTicketAsImage() {
  const ticketCard = document.getElementById('cinemaTicketCard');
  if (!ticketCard) return;

  const originalBtnContent = downloadPassBtn.innerHTML;
  downloadPassBtn.innerHTML = `
    <span class="inline-block animate-spin mr-1">⏳</span>
    <span>Generating High-Res Pass...</span>
  `;

  html2canvas(ticketCard, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#FAF6F0'
  }).then(canvas => {
    const link = document.createElement('a');
    const guestName = passGuestName.textContent.replace(/\s+/g, '_') || 'Guest';
    link.download = `December_To_Remember_Pass_${guestName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    downloadPassBtn.innerHTML = originalBtnContent;
    if (window.lucide) window.lucide.createIcons();
  }).catch(err => {
    console.error('Failed to export ticket image:', err);
    alert('Unable to generate ticket image directly. You can take a screenshot of your screen!');
    downloadPassBtn.innerHTML = originalBtnContent;
  });
}

// Share ticket details with friends
function shareOnWhatsApp() {
  const currentTicket = getStoredCurrentTicket();
  if (!currentTicket) return;

  const msg = `🎉 *I'm coming to December to Remember!* 🎉%0A%0A` +
    `*Class 10th Farewell Party*%0A` +
    `🎟️ *Pass ID:* #${currentTicket.ticketId}%0A` +
    `👤 *Attendee:* ${currentTicket.fullName} (${currentTicket.classGrade} - ${currentTicket.section})%0A` +
    `👥 *Passes:* ${currentTicket.quantity} Person(s)%0A` +
    `📅 *Date:* 23rd December 2026%0A` +
    `📍 *Venue:* Pyramid Lounge, Ludhiana%0A` +
    `👔 *Dress Code:* Western Theme%0A` +
    `✨ _One last dance, endless memories ♡_%0A%0A` +
    `Register and pay ₹2,000 per person to Srishty to get your pass too!`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// ==============================================
// STORAGE & LOCAL STATE HELPERS
// ==============================================
async function loadSavedTicket() {
  const currentTicket = getStoredCurrentTicket();
  if (currentTicket) {
    if (viewMyTicketBtn) viewMyTicketBtn.classList.remove('hidden');
    if (fullNameInput) fullNameInput.value = currentTicket.fullName || '';
    if (phoneInput) phoneInput.value = currentTicket.phone || '';
    if (currentTicket.instagram && instagramInput) {
      instagramInput.value = currentTicket.instagram.replace(/^@/, '');
    }

    // Refresh status from database immediately
    try {
      const res = await fetch(`${API_BASE}/api/ticket/${encodeURIComponent(currentTicket.ticketId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.ticket) {
          localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(data.ticket));
          if (data.ticket.status === 'PENDING') {
            startStatusPolling(data.ticket.ticketId);
          }
        }
      }
    } catch (e) {
      console.warn('Initial status fetch failed:', e);
    }
  }
}

function getStoredCurrentTicket() {
  const raw = localStorage.getItem(STORAGE_CURRENT_TICKET);
  return raw ? JSON.parse(raw) : null;
}

// Confetti Effect
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#72101F', '#CCA028', '#F2D785', '#AB2338', '#ffffff']
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#72101F', '#CCA028', '#F2D785']
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#72101F', '#CCA028', '#F2D785']
      });
    }, 250);
  }
}

// Live Countdown Timer
function initCountdown() {
  function update() {
    const now = new Date().getTime();
    const diff = EVENT_DATE - now;

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  update();
  setInterval(update, 1000);
}

// ==============================================
// SECRET ADMIN TRIPLE-TAP GESTURE
// Tap 3 times on "December to Remember" or "Theme"
// lands directly on the Admin Page (admin.html)
// ==============================================
function initDecemberTripleTapAdmin() {
  // Check URL shortcut (?admin, ?srishty, #admin)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('admin') || urlParams.has('srishty') || window.location.hash === '#admin') {
    window.location.href = 'admin.html';
    return;
  }

  let tapCount = 0;
  let lastTapTime = 0;
  let resetTimer = null;

  function handleTap(e) {
    const now = Date.now();

    // Debounce duplicate synthetic events (e.g. touchend followed by click within 40ms)
    if (now - lastTapTime < 40) {
      return;
    }

    // Reset tap counter if gap between taps exceeds 1500ms
    if (now - lastTapTime > 1500) {
      tapCount = 0;
    }

    lastTapTime = now;
    tapCount++;

    if (resetTimer) {
      clearTimeout(resetTimer);
    }

    resetTimer = setTimeout(() => {
      tapCount = 0;
    }, 1500);

    if (tapCount >= 3) {
      tapCount = 0;
      clearTimeout(resetTimer);

      showAdminToast();

      // Haptic feedback if supported on mobile devices
      if (typeof navigator.vibrate === 'function') {
        try { navigator.vibrate([40, 60, 40]); } catch (_) {}
      }

      // Smooth landing to the admin page
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 250);
    }
  }

  function showAdminToast() {
    let toast = document.getElementById('adminLandingToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminLandingToast';
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-wine-900 text-gold-300 border border-gold-400 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-serif font-bold transition-all';
      toast.innerHTML = '<span>👑</span><span>Heading to Srishty\'s Admin Portal...</span>';
      document.body.appendChild(toast);
    } else {
      toast.classList.remove('hidden');
    }
  }

  const triggerElements = document.querySelectorAll(
    '.december-admin-trigger, #decemberHeaderBrand, #decemberHeroTitle, #decemberThemeBadge'
  );

  triggerElements.forEach(el => {
    el.addEventListener('click', handleTap);
    el.addEventListener('touchend', handleTap, { passive: true });
  });
}
