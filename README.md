# 🎄 December to Remember — Class 10th Farewell Party Pass Web App

A luxury mobile-first web application created specifically for the **Class 10th Farewell Party: December to Remember** held at **Pyramid Lounge, Ludhiana**.

Attendees can enter their details to RSVP, and instantly generate a **movie-ticket-style cinema pass** with an authentic perforated tear line, holographic seal stamp, scannable QR code, barcode, and attendee verification.

---

## ✨ Features

- **Flyer-Identical Aesthetic**:
  - Matches the exact design language of the invitation flyer:
    - Elegant wine/burgundy tones (`#72101F`), champagne ivory canvas, gold foil flourishes, and festive holiday greenery.
    - Typography: *Alex Brush* cursive script paired with classic *Playfair Display* & *Cinzel*.
    - Prominently showcases date (**23rd December 2026**), venue (**Pyramid Lounge, Ludhiana**), dress code (**Western Theme**), and pass rate (**₹2,000**).
- **Interactive RSVP & Booking Form**:
  - Full Name, Class & Section (e.g. 10th-A), WhatsApp/Phone, Instagram Handle.
  - Pass counter (1–5 passes) with dynamic total calculation.
  - Optional DJ song request for the farewell dance.
- **Cinema-Style QR Entry Pass**:
  - Perforated cinema ticket notches and tear line.
  - Unique Ticket ID (e.g., `#DTR-2026-X8491`).
  - Scannable dynamic QR code generated using QRCode.js.
  - Cinema barcode graphic.
  - Hologram gold seal stamp with active status.
- **Save & Share Actions**:
  - 📥 **Download Ticket (Save to Photos)**: Generates a high-res retina image using `html2canvas`.
  - 💬 **Share Ticket on WhatsApp**: Formatted WhatsApp message with pass reference and party details.
  - 💾 **Local Storage Persistence**: Reloading the page retains the user's pass in the "My Pass" tab.
- **Organizer Gate Scanner Simulator**:
  - Tap the shield/scanner icon in the header to simulate scanning tickets at the door.
  - Instantly marks attendee as `CHECKED IN` at Pyramid Lounge.
- **Live Countdown Timer**:
  - Real-time countdown clock counting down to **23rd December 2026, 6:00 PM**.
- **Original Poster Lightbox**:
  - Built-in modal to view the original high-resolution invitation card.

---

## 🚀 How to Run Locally

You can run this lightweight web app directly in any browser:

### Option 1: Double-click
Simply open `index.html` in Safari, Google Chrome, or any modern web browser.

### Option 2: Local HTTP Server
Using Python (pre-installed on macOS):
```bash
cd /Users/ishika/Documents/Github/december-to-remember-tickets
python3 -m http.server 3000
```
Then visit `http://localhost:3000` on your computer or mobile device.

### Option 3: Using Node / npx
```bash
cd /Users/ishika/Documents/Github/december-to-remember-tickets
npx serve .
```

---

## 📱 Mobile Preview
The layout is optimized for mobile screens (max-width `480px` on desktop) with responsive touch controls, intuitive bottom navigation bar, and one-tap download.
# book-ticket-farewell
