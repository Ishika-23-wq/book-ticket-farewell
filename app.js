/* ===================================================
   DECEMBER TO REMEMBER - CLASS 10TH FAREWELL APP JS
=================================================== */

// Global State
let passQuantity = 1;
const PASS_PRICE = 2000;
let qrcodeInstance = null;

// Target Event Date: December 23, 2026 18:00:00 (6:00 PM)
const EVENT_DATE = new Date('2026-12-23T18:00:00+05:30').getTime();

// Storage keys
const STORAGE_CURRENT_TICKET = 'dtr_current_ticket';
const STORAGE_ALL_ATTENDEES = 'dtr_all_attendees';

// DOM Elements
const form = document.getElementById('bookingForm');
const fullNameInput = document.getElementById('fullName');
const classGradeInput = document.getElementById('classGrade');
const sectionInput = document.getElementById('section');
const phoneInput = document.getElementById('phoneNumber');
const instagramInput = document.getElementById('instagramHandle');
const djSongInput = document.getElementById('djSong');

const passCountEl = document.getElementById('passCount');
const totalAmountText = document.getElementById('totalAmountText');
const decreasePassesBtn = document.getElementById('decreasePasses');
const increasePassesBtn = document.getElementById('increasePasses');

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
const passQuantityEl = document.getElementById('passQuantity');
const passPaidRate = document.getElementById('passPaidRate');
const passBarcodeText = document.getElementById('passBarcodeText');
const checkInBadge = document.getElementById('checkInBadge');
const qrCodeContainer = document.getElementById('qrcode');

// Buttons inside ticket panel
const downloadPassBtn = document.getElementById('downloadPassBtn');
const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
const editDetailsBtn = document.getElementById('editDetailsBtn');
const goToRegisterBtn = document.getElementById('goToRegisterBtn');

// Organizer Modal Elements
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
  updateAttendeesCount();
});

// Event Listeners
function setupEventListeners() {
  // Pass counter
  decreasePassesBtn.addEventListener('click', () => {
    if (passQuantity > 1) {
      passQuantity--;
      updatePassCounter();
    }
  });

  increasePassesBtn.addEventListener('click', () => {
    if (passQuantity < 5) {
      passQuantity++;
      updatePassCounter();
    }
  });

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
  downloadPassBtn.addEventListener('click', downloadTicketAsImage);
  shareWhatsAppBtn.addEventListener('click', shareOnWhatsApp);

  // Poster Modal
  if (openPosterBtn) {
    openPosterBtn.addEventListener('click', () => {
      posterModal.classList.remove('hidden');
    });
  }
  if (closePosterBtn) {
    closePosterBtn.addEventListener('click', () => {
      posterModal.classList.add('hidden');
    });
  }
  if (closePosterBtn2) {
    closePosterBtn2.addEventListener('click', () => {
      posterModal.classList.add('hidden');
    });
  }

  // Organizer Modal
  organizerBtn.addEventListener('click', () => {
    organizerModal.classList.remove('hidden');
    scanResultBox.classList.add('hidden');
    updateAttendeesCount();
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
      alert('No active ticket found yet. Please generate one first!');
    }
  });
}

// Update pass count & price
function updatePassCounter() {
  passCountEl.textContent = passQuantity;
  const total = passQuantity * PASS_PRICE;
  totalAmountText.textContent = `₹${total.toLocaleString('en-IN')}`;
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
    window.scrollTo({ top: 400, behavior: 'smooth' });
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
    window.scrollTo({ top: 420, behavior: 'smooth' });
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

  if (!fullName || !phone) {
    alert('Please fill in your name and phone number.');
    return;
  }

  // Generate unique Ticket ID
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `DTR-2026-X${randomNum}`;
  const totalAmount = passQuantity * PASS_PRICE;

  const ticketData = {
    ticketId,
    fullName,
    classGrade,
    section,
    phone,
    instagram,
    song,
    quantity: passQuantity,
    totalAmount,
    eventName: "December to Remember - Class 10th Farewell Party",
    venue: "Pyramid Lounge, Ludhiana",
    date: "23rd December 2026",
    time: "6:00 PM Onwards",
    dressCode: "Western Theme",
    status: "CONFIRMED & VALID",
    checkedIn: false,
    timestamp: new Date().toISOString()
  };

  // Save to localStorage
  localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(ticketData));

  // Add to all attendees directory
  const attendees = getAllAttendees();
  attendees.push(ticketData);
  localStorage.setItem(STORAGE_ALL_ATTENDEES, JSON.stringify(attendees));

  // Trigger festive celebration confetti
  triggerConfetti();

  // Switch to ticket view
  switchTab('ticket');
  viewMyTicketBtn.classList.remove('hidden');
  updateAttendeesCount();
}

// Render Ticket Details and Generate QR Code
function renderTicket(ticket) {
  passRefId.textContent = `#${ticket.ticketId}`;
  passGuestName.textContent = ticket.fullName;
  passGradeSec.textContent = `${ticket.classGrade} • ${ticket.section}`;
  passQuantityEl.textContent = `${ticket.quantity} ${ticket.quantity === 1 ? 'Person' : 'Persons'}`;
  passPaidRate.textContent = `₹${ticket.totalAmount.toLocaleString('en-IN')}`;
  passBarcodeText.textContent = `${ticket.ticketId}-LUDHIANA-VIP`;

  if (ticket.checkedIn) {
    checkInBadge.textContent = 'STATUS: CHECKED IN';
    checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else {
    checkInBadge.textContent = 'STATUS: ADMIT GRANTED';
    checkInBadge.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold bg-wine-100 text-wine-800 border border-wine-300';
  }

  // Generate QR code data payload
  // Encode verifiable QR string with ticket ID and guest info
  const qrPayload = JSON.stringify({
    id: ticket.ticketId,
    name: ticket.fullName,
    grade: ticket.classGrade,
    sec: ticket.section,
    passes: ticket.quantity,
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

// Load saved ticket if exists
function loadSavedTicket() {
  const currentTicket = getStoredCurrentTicket();
  if (currentTicket) {
    viewMyTicketBtn.classList.remove('hidden');
    // Pre-populate input fields if user wants to review
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

function updateAttendeesCount() {
  const attendees = getAllAttendees();
  if (registeredCountBadge) {
    registeredCountBadge.textContent = attendees.length;
  }
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
    scale: 3, // Crisp 3x retina resolution for mobile screenshots
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

// Share ticket details via WhatsApp
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
    `See you on the dance floor!`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// Confetti Effect
function triggerConfetti() {
  if (typeof confetti === 'function') {
    // Rich Wine & Gold festive confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#72101F', '#CCA028', '#F2D785', '#AB2338', '#ffffff']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#72101F', '#CCA028', '#F2D785']
      });
      confetti({
        particleCount: 50,
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

// Organizer Gate Ticket Verification
function verifyTicketFromInput() {
  const query = scanInput.value.trim();
  if (!query) {
    alert('Please enter or scan a Ticket ID.');
    return;
  }

  scanResultBox.classList.remove('hidden');

  const attendees = getAllAttendees();
  let found = attendees.find(a => a.ticketId.toLowerCase() === query.toLowerCase() || (query.includes(a.ticketId)));

  if (!found) {
    // Check if it matches current stored ticket
    const current = getStoredCurrentTicket();
    if (current && (current.ticketId.toLowerCase() === query.toLowerCase() || query.includes(current.ticketId))) {
      found = current;
    }
  }

  if (found) {
    found.checkedIn = true;
    localStorage.setItem(STORAGE_CURRENT_TICKET, JSON.stringify(found));

    scanResultBox.className = 'p-3 rounded-xl text-xs space-y-1 bg-emerald-50 border border-emerald-300 text-emerald-900';
    scanResultBox.innerHTML = `
      <div class="font-bold flex items-center gap-1.5 text-sm text-emerald-800">
        <span class="text-base">✅</span> VALID PASS — ADMIT GUEST
      </div>
      <div><strong>Guest:</strong> ${found.fullName} (${found.classGrade} - ${found.section})</div>
      <div><strong>Passes:</strong> ${found.quantity} Person(s) | <strong>Rate:</strong> ₹${found.totalAmount}</div>
      <div class="text-[10px] text-emerald-700 pt-1 font-mono">Timestamp: Checked in at Pyramid Lounge door!</div>
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
