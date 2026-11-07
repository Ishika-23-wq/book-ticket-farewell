# 🎄 December to Remember — Class 10th Farewell Party Pass Web App
### With Amount-Locked UPI Payment, Multi-Guest Registration & Secret Srishty Admin Portal

A mobile-first cinema ticket web application created for the **Class 10th Farewell Party: December to Remember** held at **Pyramid Lounge, Ludhiana**.

---

## 🔒 Secret Admin Portal Access (Hidden from Regular Students)

To protect the admin controls and ensure only **Srishty** can access attendee lists and approve passes, the Admin and Gate Scanner buttons are **100% hidden by default**. Regular participants will see no trace of an admin portal.

### How Srishty Can Access Her Admin Portal:

1. **Method 1: Direct Private Link (Recommended)**
   - Srishty opens the web app with the secret parameter:
     👉 **`http://localhost:3000/?admin=srishty`** (or `?srishty` / `#admin`)
   - The app automatically unlocks and remembers Srishty's device. On her phone, the **👑 Srishty Admin** button will remain available.

2. **Method 2: Secret Triple-Tap Gesture (Works on Any Device)**
   - On any phone or browser, quickly **tap the top header title ("DECEMBER TO REMEMBER" or "✦" badge) 3 times**.
   - This secretly unlocks the portal and prompts for Srishty's PIN (`2026`).

3. **Locking & Hiding**:
   - When Srishty finishes reviewing, she can click **Lock**. The app asks if she wants to hide the admin button again on that device.

---

## 👥 Multi-Guest Group Booking & Automatic Price Locking

- **Pass Counter**: Participants can book for 1 to 5 people using `+` / `-`.
- **Accompanying Guest Details**: When 2+ passes are selected, dynamic input cards appear for each companion (Full Name, Class & Section).
- **Auto-Calculated Amount**:
  - 1 Person: ₹2,000
  - 2 People: ₹4,000
  - 3 People: ₹6,000
  - 4 People: ₹8,000
  - 5 People: ₹10,000
- **Locked UPI Link & Dynamic QR Code**: Pre-fills the exact total sum in GPay, PhonePe, and Paytm so users cannot alter the amount.
- **Strict Validation**: Less or more than the calculated exact total is blocked.

---

## 🎟️ Ticket Approval Workflow

- **Pending State**: The cinema pass and QR code are completely hidden. Attendees see an *"Application Under Review"* card with a direct WhatsApp notification button to Srishty.
- **Rejected State**: If rejected, a dedicated screen displays Srishty's exact reason.
- **Approved State**: Once Srishty clicks **Approve**, the movie ticket pass unlocks with perforated tear lines, dynamic entry QR code, all companion names, and retina download.
