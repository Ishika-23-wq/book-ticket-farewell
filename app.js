/* ===================================================
   DECEMBER TO REMEMBER - CLASS 10TH FAREWELL APP JS
   With Srishty's UPI Payment Verification & Admin Portal
=================================================== */

// Global State
const PASS_PRICE = 2000;
let qrcodeInstance = null;
let isAdminAuthenticated = false;
let adminCurrentFilter = 'pending'; // 'pending' | 'all'

// Srishty's Details
const SRISHTY_UPI = '9592982012@fam';
const ADMIN_PIN = '11011';

// Target Event Date: December 23, 2026 18:00:00 (6:00 PM)
const EVENT_DATE = new Date('2026-12-23T18:00:00+05:30').getTime();

// Storage keys
const STORAGE_CURRENT_TICKET = 'dtr_current_ticket';
const STORAGE_ALL_ATTENDEES = 'dtr_all_attendees';

// DOM Elements - Form
const form = document.getElementById('bookingForm');
const fullNameInput = document.getElementById('fullName');
const classGradeInput = document.getElementById('classGrade');
const sectionInput = document.getElementById('section');
const phoneInput = document.getElementById('phoneNumber');
const instagramInput = document.getElementById('instagramHandle');
const djSongInput = document.getElementById('djSong');
const utrNumberInput = document.getElementById('utrNumber');
const copyUpiBtn = document.getElementById('copyUpiBtn');
const copyUpiLabel = document.getElementById('copyUpiLabel');

// Panels & Navigation
const registerPanel = document.getElementById('registerPanel');
const ticketPanel = document.getElementById('ticketPanel');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const tabTicketBtn = document.getElementById('tabTicketBtn');
const viewMyTicketBtn = document.getElementById('viewMyTicketBtn');
const emptyTicketState = document.getElementById('emptyTicketState');
const activeTicketState = document.getElementById('activeTicketState');

// Ticket display fields
const passRefId = document.getElementById('passRefId');
const passGuestName = document.getElementById('passGuestName');
const passGradeSec = document.getElementById('passGradeSec');
const passUtrDisplay = document.getElementById('passUtrDisplay');
const passBarcodeText = document.getElementById('passBarcodeText');
const checkInBadge = document.getElementById('checkInBadge');
const qrCodeContainer = document.getElementById('qrcode');
const qrLockedOverlay = document.getElementById('qrLockedOverlay');
const ticketStatusAlert = document.getElementById('ticketStatusAlert');
const ticketStatusDot = document.getElementById('ticketStatusDot');
const ticketStatusTitle = document.getElementById('ticketStatusTitle');
const ticketStatusPill = document.getElementById('ticketStatusPill');
const ticketStatusDesc = document.getElementById('ticketStatusDesc');
const alertUtrNumber = document.getElementById('alertUtrNumber');
const ticketSeal = document.getElementById('ticketSeal');
const sealTopText = document.getElementById('sealTopText');
const sealIconWrap = document.getElementById('sealIconWrap');
const approvalByFooter = document.getElementById('approvalByFooter');

// Buttons inside ticket panel
const downloadPassBtn = document.getElementById('downloadPassBtn');
const downloadBtnText = document.getElementById('downloadBtnText');
const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
const notifySrishtyBtn = document.getElementById('notifySrishtyBtn');
const editDetailsBtn = document.getElementById('editDetailsBtn');
const goToRegisterBtn = document.getElementById('goToRegisterBtn');

// Srishty Admin Modal Elements
const srishtyAdminBtn = document.getElementById('srishtyAdminBtn');
const pendingBadgeHeader = document.getElementById('pendingBadgeHeader');
const srishtyAdminModal = document.getElementById('srishtyAdminModal');
const closeSrishtyAdminBtn = document.getElementById('closeSrishtyAdminBtn');
const srishtyAuthView = document.getElementById('srishtyAuthView');
const srishtyDashboardView = document.getElementById('srishtyDashboardView');
const adminPinInput = document.getElementById('adminPinInput');
const unlockAdminBtn = document.getElementById('unlockAdminBtn');
const lockAdminBtn = document.getElementById('lockAdminBtn');
const statPendingCount = document.getElementById('statPendingCount');
const statApprovedCount = document.getElementById('statApprovedCount');
const statTotalCollected = document.getElementById('statTotalCollected');
const adminFilterPendingBtn = document.getElementById('adminFilterPendingBtn');
const adminFilterAllBtn = document.getElementById('adminFilterAllBtn');
const adminPendingFilterCount = document.getElementById('adminPendingFilterCount');
const adminAllFilterCount = document.getElementById('adminAllFilterCount');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminRegistrationsList = document.getElementById('adminRegistrationsList');

// Organizer Door Scanner Elements
const organizerBtn = document.getElementById('organizerBtn');
const organizerModal = document.getElementById('organizerModal');
const closeOrganizerBtn = document.getElementById('closeOrganizerBtn');
const scanInput = document.getElementById('scanInput');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
const loadCurrentTicketBtn = document.getElementById('loadCurrentTicketBtn');
const scanResultBox = document.getElementById('scanResultBox');
const registeredCountBadge = document.getElementById('registeredCountBadge');

// Poster Modal Elements
const openPosterBtn = document.getElementById('openPosterBtn');
const posterModal = document.getElementById('posterModal');
const closePosterBtn = document.getElementById('closePosterBtn');
const closePosterBtn2 = document.getElementById('closePosterBtn2');

// Footer Nav
const navHomeBtn = document.getElementById('navHomeBtn');
const navBookBtn = document.getElementById('navBookBtn');
const navPassBtn = document.getElementById('navPassBtn');

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initCountdown();
  setupEventListeners();
  loadSavedTicket();
  updateAdminStatsAndBadges();
});

// Event Listeners
function setupEventListeners() {
  // Copy UPI
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(SRISHTY_UPI).then(() => {
        copyUpiLabel.textContent = 'Copied!';
        setTimeout(() => {
          copyUpiLabel.textContent = 'Copy';
        }, 2000);
      }).catch(() => {
        prompt('Copy Srishty UPI ID:', SRISHTY_UPI);
      });
    });
  }

  // Tab switching
  tabRegisterBtn.addEventListener('click', () => switchTab('register'));
  tabTicketBtn.addEventListener('click', () => switchTab('ticket'));
  viewMyTicketBtn.addEventListener('click', () => switchTab('ticket'));
  goToRegisterBtn.addEventListener('click', () => switchTab('register'));
  editDetailsBtn.addEventListener('click', () => switchTab('register'));

  // Footer nav
  if (navHomeBtn) navHomeBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  if (navBookBtn) navBookBtn.addEventListener('click', () => switchTab('register'));
  if (navPassBtn) navPassBtn.addEventListener('click', () => switchTab('ticket'));

  // Form submit
  form.addEventListener('submit', handleFormSubmit);

  // Ticket actions
  downloadPassBtn.addEventListener('click', handleDownloadPassClick);
  shareWhatsAppBtn.addEventListener('click', shareOnWhatsApp);
  notifySrishtyBtn.addEventListener('click', notifySrishtyOnWhatsApp);

  // Srishty Admin Modal
  srishtyAdminBtn.addEventListener('click', openSrishtyAdminModal);
  closeSrishtyAdminBtn.addEventListener('click', () => srishtyAdminModal.classList.add('hidden'));
  unlockAdminBtn.addEventListener('click', authenticateAdmin);
  adminPinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') authenticateAdmin();
  });
  lockAdminBtn.addEventListener('click', lockAdmin);

  adminFilterPendingBtn.addEventListener('click', () => {
    adminCurrentFilter = 'pending';
    adminFilterPendingBtn.className = 'flex-1 py-1.5 rounded-lg bg-wine-700 text-white shadow-xs transition';
    adminFilterAllBtn.className = 'flex-1 py-1.5 rounded-lg text-wine-900 transition';
    renderAdminRegistrations();
  });

  adminFilterAllBtn.addEventListener('click', () => {
    adminCurrentFilter = 'all';
    adminFilterAllBtn.className = 'flex-1 py-1.5 rounded-lg bg-wine-700 text-white shadow-xs transition';
    adminFilterPendingBtn.className = 'flex-1 py-1.5 rounded-lg text-wine-900 transition';
    renderAdminRegistrations();
  });

  adminSearchInput.addEventListener('input', renderAdminRegistrations);

  // Poster Modal
  if (openPosterBtn) {
    openPosterBtn.addEventListener('click', () => posterModal.classList.remove('hidden'));
  }
  if (closePosterBtn) {
    closePosterBtn.addEventListener('click', () => posterModal.classList.add('hidden'));
  }
  if (closePosterBtn2) {
    closePosterBtn2.addEventListener('click', () => posterModal.classList.add('hidden'));
  }

  // Organizer Door Scanner Modal
  organizerBtn.addEventListener('click', () => {
    organizerModal.classList.remove('hidden');
    scanResultBox.classList.add('hidden');
    updateAdminStatsAndBadges();
  });
  closeOrganizerBtn.addEventListener('click', () => {
    organizerModal.classList.add('hidden');
  });
  verifyCodeBtn.addEventListener('click', verifyTicketFromInput);
  loadCurrentTicketBtn.addEventListener('click', () => {
    const ticket = getStoredCurrentTicket();
    if (ticket) {
      scanInput.value = ticket.ticketId;
    } else {
      alert('No active ticket found yet. Please submit registration first!');
    }
  });
}

// Switch between tabs
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

    const currentTicket = getStoredCurrentTicket();
    if (!currentTicket) {
      emptyTicketState.classList.remove('hidden');
      activeTicketState.classList.add('hidden');
    } else {
      emptyTicketState.classList.add('hidden');
      activeTicketState.classList.remove('hidden');
      renderTicket(currentTicket);
    }
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Handle Form Submission
function handleFormSubmit(e) {
  e.preventDefault();

  const fullName = fullNameInput.value.trim();
  const classGrade = classGradeInput.value;
  const section = sectionInput.value;
  const phone = phoneInput.value.trim();
  const instagram = instagramInput.value.trim() ? `@${instagramInput.value.replace(/^@/, '')}` : '';
  const song = djSongInput.value.trim();
  const utr = utrNumberInput.value.trim();

  if (!fullName || !phone) {
    alert('Please fill in your name and phone number.');
    return;
  }

  if (!utr) {
    alert('Please enter the 12-digit UPI UTR / Transaction Reference number after paying ₹2,000 to Srishty.');
    utrNumberInput.focus();
    return;
  }

  // Generate unique Ticket ID
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `DTR-2026-X${randomNum}`;

  const ticketData = {
    ticketId,
    fullName,
    classGrade,
    section,
    phone,
    instagram,
    song,
    quantity: 1,
    totalAmount: PASS_PRICE, // Exactly ₹2000
    utrNumber: utr,
    paidTo: SRISHTY_UPI,
    status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
    approvedBy: null,
    approvedAt: null,
    checkedIn: false,
    timestamp: new Date().toISOString()
  };

  // Save to current active ticket
  localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(ticketData));

  // Add or update in attendees list
  const attendees = getAllAttendees();
  const existingIdx = attendees.findIndex(a => a.ticketId === ticketId);
  if (existingIdx >= 0) {
    attendees[existingIdx] = ticketData;
  } else {
    attendees.unshift(ticketData);
  }
  localStorage.setItem(STORAGE_ALL_ATTENDEES, JSON.stringify(attendees));

  // Switch to ticket view
  switchTab('ticket');
  viewMyTicketBtn.classList.remove('hidden');
  updateAdminStatsAndBadges();

  // Subtle alert indicating pending approval
  setTimeout(() => {
    alert(`🎉 Registration details submitted!\n\nYour ₹2,000 payment (UTR: ${utr}) has been sent to Srishty for confirmation.\n\nPlease tap "Send Payment Details to Srishty on WhatsApp" to notify her directly!`);
  }, 400);
}

// Render Ticket Details with Pending vs Approved States
function renderTicket(ticket) {
  passRefId.textContent = `#${ticket.ticketId}`;
  passGuestName.textContent = ticket.fullName;
  passGradeSec.textContent = `${ticket.classGrade} • ${ticket.section}`;
  passUtrDisplay.textContent = ticket.utrNumber || 'N/A';
  passBarcodeText.textContent = `${ticket.ticketId}-LUDHIANA-VIP`;
  if (alertUtrNumber) alertUtrNumber.textContent = ticket.utrNumber || 'N/A';

  const isApproved = ticket.status === 'APPROVED';

  if (isApproved) {
    // ACTIVE / APPROVED STATE
    ticketStatusAlert.className = 'bg-emerald-50 border border-emerald-300 text-emerald-950 px-3.5 py-3 rounded-2xl text-xs space-y-1 shadow-sm';
    ticketStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
    ticketStatusTitle.className = 'font-bold text-sm text-emerald-900';
    ticketStatusTitle.textContent = 'Pass Approved & Confirmed by Srishty!';
    ticketStatusPill.className = 'text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold';
    ticketStatusPill.textContent = 'ACTIVE PASS';
    ticketStatusDesc.innerHTML = `Your ₹2,000 payment was verified by <strong>Srishty</strong>. Your movie pass is officially active for entry at <strong>Pyramid Lounge</strong>!`;

    // Unlock QR Code
    qrLockedOverlay.classList.add('hidden');
    
    // Status Badge & Seal
    sealTopText.textContent = 'VERIFIED';
    sealIconWrap.innerHTML = '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>';
    ticketSeal.className = 'gold-seal w-16 h-16 rounded-full border-2 border-gold-600 flex flex-col items-center justify-center bg-gradient-to-tr from-gold-300 via-gold-400 to-gold-200 text-wine-950 shadow-md';

    if (ticket.checkedIn) {
      checkInBadge.textContent = 'STATUS: CHECKED IN AT DOOR';
      checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
    } else {
      checkInBadge.textContent = 'STATUS: ADMIT GRANTED';
      checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-wine-100 text-wine-800 border border-wine-300';
    }

    approvalByFooter.textContent = 'Approved by Srishty (Lead Org)';
    approvalByFooter.className = 'text-[9px] text-emerald-800 font-bold';

    downloadPassBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    downloadBtnText.textContent = 'Download Ticket (Save to Photos)';
    notifySrishtyBtn.classList.add('hidden');

    // Scannable QR Payload
    const qrPayload = JSON.stringify({
      id: ticket.ticketId,
      name: ticket.fullName,
      grade: ticket.classGrade,
      sec: ticket.section,
      utr: ticket.utrNumber,
      approvedBy: "Srishty",
      status: "VALID_ENTRY",
      event: "December to Remember",
      venue: "Pyramid Lounge",
      date: "2026-12-23"
    });
    generateQRCode(qrPayload);

  } else {
    // PENDING STATE
    ticketStatusAlert.className = 'bg-amber-50 border border-amber-300 text-amber-950 px-3.5 py-3 rounded-2xl text-xs space-y-1 shadow-sm';
    ticketStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse';
    ticketStatusTitle.className = 'font-bold text-sm text-amber-900';
    ticketStatusTitle.textContent = "Payment Awaiting Srishty's Approval";
    ticketStatusPill.className = 'text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold';
    ticketStatusPill.textContent = 'PENDING APPROVAL';
    ticketStatusDesc.innerHTML = `Your ₹2,000 payment (UTR: <span class="font-mono font-bold text-wine-900">${ticket.utrNumber}</span>) has been submitted. <strong>Srishty</strong> must confirm it before your entry QR pass unlocks!`;

    // Keep QR Code locked
    qrLockedOverlay.classList.remove('hidden');

    sealTopText.textContent = 'PENDING';
    sealIconWrap.innerHTML = '<i data-lucide="clock" class="w-4 h-4 stroke-[2.5]"></i>';
    ticketSeal.className = 'gold-seal w-16 h-16 rounded-full border-2 border-amber-500 flex flex-col items-center justify-center bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-100 text-amber-950 shadow-md';

    checkInBadge.textContent = "STATUS: PENDING SRISHTY'S APPROVAL";
    checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300';

    approvalByFooter.textContent = "Awaiting Srishty's Verification";
    approvalByFooter.className = 'text-[9px] text-amber-800 italic';

    downloadPassBtn.classList.add('opacity-75');
    downloadBtnText.textContent = 'Download Ticket (Pending Approval)';
    notifySrishtyBtn.classList.remove('hidden');

    // Generate static placeholder QR
    generateQRCode(`PENDING_APPROVAL_FOR_${ticket.ticketId}`);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
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

// Handle Ticket Download
function handleDownloadPassClick() {
  const currentTicket = getStoredCurrentTicket();
  if (!currentTicket) return;

  if (currentTicket.status !== 'APPROVED') {
    const confirmDownload = confirm("⚠️ Your ticket is still awaiting Srishty's approval! Would you like to save it as a pending pass anyway, or notify Srishty first?");
    if (!confirmDownload) return;
  }

  downloadTicketAsImage();
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

// Send WhatsApp Payment Confirmation to Srishty
function notifySrishtyOnWhatsApp() {
  const current = getStoredCurrentTicket();
  if (!current) return;

  const msg = `👑 *Payment Confirmation for Srishty* 👑%0A%0A` +
    `Hi Srishty! I have registered for *December to Remember (Class 10th Farewell Party)* and completed my ₹2,000 UPI payment.%0A%0A` +
    `👤 *Attendee:* ${current.fullName} (${current.classGrade} - ${current.section})%0A` +
    `📱 *Phone:* ${current.phone}%0A` +
    `💳 *UTR / Ref No:* ${current.utrNumber}%0A` +
    `💵 *Amount Paid:* ₹2,000 (Exact)%0A` +
    `🎟️ *Ticket ID:* ${current.ticketId}%0A%0A` +
    `Please check your FamPay/UPI app (${SRISHTY_UPI}) and approve my VIP pass in your Admin Portal! ✨`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// Share ticket details with friends
function shareOnWhatsApp() {
  const currentTicket = getStoredCurrentTicket();
  if (!currentTicket) return;

  const msg = `🎉 *I'm coming to December to Remember!* 🎉%0A%0A` +
    `*Class 10th Farewell Party*%0A` +
    `🎟️ *Pass ID:* ${currentTicket.ticketId}%0A` +
    `👤 *Attendee:* ${currentTicket.fullName} (${currentTicket.classGrade} - ${currentTicket.section})%0A` +
    `📅 *Date:* 23rd December 2026%0A` +
    `📍 *Venue:* Pyramid Lounge, Ludhiana%0A` +
    `👔 *Dress Code:* Western Theme%0A` +
    `✨ _One last dance, endless memories ♡_%0A%0A` +
    `Register and pay ₹2,000 to Srishty to get your pass too!`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// ==============================================
// SRISHTY ADMIN PORTAL LOGIC
// ==============================================
function openSrishtyAdminModal() {
  srishtyAdminModal.classList.remove('hidden');
  if (isAdminAuthenticated) {
    srishtyAuthView.classList.add('hidden');
    srishtyDashboardView.classList.remove('hidden');
    renderAdminDashboard();
  } else {
    srishtyAuthView.classList.remove('hidden');
    srishtyDashboardView.classList.add('hidden');
    adminPinInput.value = '';
    adminPinInput.focus();
  }
}

function authenticateAdmin() {
  const entered = adminPinInput.value.trim();
  if (entered === ADMIN_PIN || entered === 'admin' || entered === '2026') {
    isAdminAuthenticated = true;
    srishtyAuthView.classList.add('hidden');
    srishtyDashboardView.classList.remove('hidden');
    renderAdminDashboard();
  } else {
    alert('Incorrect PIN. Please enter Srishty’s PIN (Default: 2026)');
  }
}

function lockAdmin() {
  isAdminAuthenticated = false;
  srishtyAuthView.classList.remove('hidden');
  srishtyDashboardView.classList.add('hidden');
  adminPinInput.value = '';
}

function renderAdminDashboard() {
  updateAdminStatsAndBadges();
  renderAdminRegistrations();
}

function updateAdminStatsAndBadges() {
  const attendees = getAllAttendees();
  const pending = attendees.filter(a => a.status === 'PENDING');
  const approved = attendees.filter(a => a.status === 'APPROVED');
  const totalAmount = approved.length * PASS_PRICE;

  // Update header badge
  if (pendingBadgeHeader) {
    if (pending.length > 0) {
      pendingBadgeHeader.textContent = pending.length;
      pendingBadgeHeader.classList.remove('hidden');
    } else {
      pendingBadgeHeader.classList.add('hidden');
    }
  }

  // Update dashboard stats
  if (statPendingCount) statPendingCount.textContent = pending.length;
  if (statApprovedCount) statApprovedCount.textContent = approved.length;
  if (statTotalCollected) statTotalCollected.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;

  if (adminPendingFilterCount) adminPendingFilterCount.textContent = pending.length;
  if (adminAllFilterCount) adminAllFilterCount.textContent = attendees.length;

  if (registeredCountBadge) registeredCountBadge.textContent = attendees.length;
}

function renderAdminRegistrations() {
  const attendees = getAllAttendees();
  const query = (adminSearchInput.value || '').toLowerCase().trim();

  let filtered = attendees;
  if (adminCurrentFilter === 'pending') {
    filtered = attendees.filter(a => a.status === 'PENDING');
  }

  if (query) {
    filtered = filtered.filter(a =>
      a.fullName.toLowerCase().includes(query) ||
      (a.utrNumber && a.utrNumber.toLowerCase().includes(query)) ||
      a.ticketId.toLowerCase().includes(query) ||
      a.phone.includes(query)
    );
  }

  adminRegistrationsList.innerHTML = '';

  if (filtered.length === 0) {
    adminRegistrationsList.innerHTML = `
      <div class="text-center py-8 bg-white rounded-2xl border border-dashed border-[#dfcebc] text-xs text-zinc-500">
        <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-emerald-500 mb-2"></i>
        <p class="font-bold text-wine-900">${adminCurrentFilter === 'pending' ? 'All caught up! No pending payments.' : 'No registrations found.'}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  filtered.forEach(item => {
    const isPending = item.status === 'PENDING';
    const card = document.createElement('div');
    card.className = `p-3.5 bg-white rounded-2xl border shadow-xs space-y-2.5 transition ${isPending ? 'border-amber-300 ring-1 ring-amber-200' : 'border-[#e2d2c1]'}`;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="font-serif font-bold text-sm text-wine-950">${item.fullName}</div>
          <div class="text-[11px] text-wine-700 font-medium">${item.classGrade} • ${item.section}</div>
        </div>
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
          item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
          item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
          'bg-amber-100 text-amber-800 border border-amber-300'
        }">
          ${item.status}
        </span>
      </div>

      <div class="bg-champagne-50 p-2 rounded-xl text-xs space-y-1 font-mono text-[11px] border border-champagne-200">
        <div class="flex justify-between">
          <span class="text-zinc-500">Amount:</span>
          <strong class="text-wine-900 font-bold">₹${item.totalAmount} (Exact)</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">UTR / Ref:</span>
          <strong class="text-wine-950 font-bold bg-amber-100/60 px-1 rounded">${item.utrNumber || 'N/A'}</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Ticket ID:</span>
          <span class="text-zinc-700">#${item.ticketId}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Phone:</span>
          <a href="tel:${item.phone}" class="text-wine-700 hover:underline">${item.phone}</a>
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        ${isPending ? `
          <button
            onclick="adminApproveTicket('${item.ticketId}')"
            class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 active:scale-95"
          >
            <span>✅ Approve & Issue Pass</span>
          </button>
          <button
            onclick="adminRejectTicket('${item.ticketId}')"
            class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition active:scale-95"
          >
            Reject
          </button>
        ` : `
          <button
            onclick="adminRevokeTicket('${item.ticketId}')"
            class="py-1 px-2 text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-medium"
          >
            Revoke / Re-review
          </button>
        `}
        <a
          href="https://api.whatsapp.com/send?phone=${item.phone.replace(/[^0-9]/g, '')}&text=Hi%20${encodeURIComponent(item.fullName)},%20this%20is%20Srishty%20regarding%20your%20December%20to%20Remember%20ticket!"
          target="_blank"
          class="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition"
          title="Message on WhatsApp"
        >
          <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
        </a>
      </div>
    `;

    adminRegistrationsList.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Admin Action: Approve Ticket
window.adminApproveTicket = function(ticketId) {
  const attendees = getAllAttendees();
  const attendee = attendees.find(a => a.ticketId === ticketId);
  if (!attendee) return;

  attendee.status = 'APPROVED';
  attendee.approvedBy = 'Srishty';
  attendee.approvedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_ALL_ATTENDEES, JSON.stringify(attendees));

  // If this is also the current active ticket in session, update it!
  const current = getStoredCurrentTicket();
  if (current && current.ticketId === ticketId) {
    current.status = 'APPROVED';
    current.approvedBy = 'Srishty';
    current.approvedAt = attendee.approvedAt;
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(current));
    renderTicket(current);
    triggerConfetti();
  }

  renderAdminDashboard();
};

// Admin Action: Reject Ticket
window.adminRejectTicket = function(ticketId) {
  const reason = prompt('Reason for rejecting (e.g. UTR mismatch, wrong amount):', 'Payment verification failed');
  if (reason === null) return;

  const attendees = getAllAttendees();
  const attendee = attendees.find(a => a.ticketId === ticketId);
  if (!attendee) return;

  attendee.status = 'REJECTED';
  attendee.rejectReason = reason;

  localStorage.setItem(STORAGE_ALL_ATTENDEES, JSON.stringify(attendees));

  const current = getStoredCurrentTicket();
  if (current && current.ticketId === ticketId) {
    current.status = 'REJECTED';
    current.rejectReason = reason;
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(current));
    renderTicket(current);
  }

  renderAdminDashboard();
};

// Admin Action: Revoke Ticket
window.adminRevokeTicket = function(ticketId) {
  const attendees = getAllAttendees();
  const attendee = attendees.find(a => a.ticketId === ticketId);
  if (!attendee) return;

  attendee.status = 'PENDING';
  attendee.approvedBy = null;
  attendee.approvedAt = null;

  localStorage.setItem(STORAGE_ALL_ATTENDEES, JSON.stringify(attendees));

  const current = getStoredCurrentTicket();
  if (current && current.ticketId === ticketId) {
    current.status = 'PENDING';
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(current));
    renderTicket(current);
  }

  renderAdminDashboard();
};

// Door Entry Scanner Verification (incorporates Srishty's Approval check)
function verifyTicketFromInput() {
  const query = scanInput.value.trim();
  if (!query) {
    alert('Please enter or scan a Ticket ID.');
    return;
  }

  scanResultBox.classList.remove('hidden');

  const attendees = getAllAttendees();
  let found = attendees.find(a => a.ticketId.toLowerCase() === query.toLowerCase() || query.includes(a.ticketId));

  if (!found) {
    const current = getStoredCurrentTicket();
    if (current && (current.ticketId.toLowerCase() === query.toLowerCase() || query.includes(current.ticketId))) {
      found = current;
    }
  }

  if (found) {
    if (found.status !== 'APPROVED') {
      scanResultBox.className = 'p-3 rounded-xl text-xs space-y-1 bg-amber-50 border border-amber-300 text-amber-900';
      scanResultBox.innerHTML = `
        <div class="font-bold flex items-center gap-1.5 text-sm text-amber-900">
          <span class="text-base">⚠️</span> ENTRY DENIED — PAYMENT NOT APPROVED
        </div>
        <div><strong>Guest:</strong> ${found.fullName} (${found.classGrade} - ${found.section})</div>
        <div><strong>Status:</strong> ${found.status} (Awaiting Srishty's verification)</div>
        <p class="text-[11px] text-amber-800 pt-1">
          Srishty has not approved this attendee's ₹2,000 payment yet. Please contact Srishty at <strong>${SRISHTY_UPI}</strong>.
        </p>
      `;
      return;
    }

    found.checkedIn = true;
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(found));

    scanResultBox.className = 'p-3 rounded-xl text-xs space-y-1 bg-emerald-50 border border-emerald-300 text-emerald-900';
    scanResultBox.innerHTML = `
      <div class="font-bold flex items-center gap-1.5 text-sm text-emerald-800">
        <span class="text-base">✅</span> VALID PASS — ADMIT GUEST
      </div>
      <div><strong>Guest:</strong> ${found.fullName} (${found.classGrade} - ${found.section})</div>
      <div><strong>Verified By:</strong> Srishty | <strong>Amount:</strong> ₹${found.totalAmount}</div>
      <div class="text-[10px] text-emerald-700 pt-1 font-mono">Status: Checked in at Pyramid Lounge door!</div>
    `;

    renderTicket(found);
  } else {
    scanResultBox.className = 'p-3 rounded-xl text-xs space-y-1 bg-rose-50 border border-rose-300 text-rose-900';
    scanResultBox.innerHTML = `
      <div class="font-bold flex items-center gap-1.5 text-sm text-rose-800">
        <span class="text-base">❌</span> INVALID OR UNREGISTERED PASS
      </div>
      <p class="text-[11px]">No matching attendee found for code: <span class="font-mono">${query}</span>.</p>
    `;
  }
}

// Storage Helpers
function loadSavedTicket() {
  const currentTicket = getStoredCurrentTicket();
  if (currentTicket) {
    viewMyTicketBtn.classList.remove('hidden');
    fullNameInput.value = currentTicket.fullName || '';
    phoneInput.value = currentTicket.phone || '';
    if (currentTicket.instagram) {
      instagramInput.value = currentTicket.instagram.replace(/^@/, '');
    }
  }
}

function getStoredCurrentTicket() {
  const raw = localStorage.getItem(STORAGE_CURRENT_TICKET);
  return raw ? JSON.parse(raw) : null;
}

function getAllAttendees() {
  const raw = localStorage.getItem(STORAGE_ALL_ATTENDEES);
  return raw ? JSON.parse(raw) : [];
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

    if (diff <= 0) {
      document.getElementById('cd-days').textContent = '00';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-mins').textContent = '00';
      document.getElementById('cd-secs').textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    document.getElementById('cd-days').textContent = pad(days);
    document.getElementById('cd-hours').textContent = pad(hours);
    document.getElementById('cd-mins').textContent = pad(mins);
    document.getElementById('cd-secs').textContent = pad(secs);
  }

  update();
  setInterval(update, 1000);
}
