# 🎄 December to Remember — Class 10th Farewell Party Pass Web App
### With Srishty's UPI QR Payment & Admin Approval System

A mobile-first cinema ticket web application created for the **Class 10th Farewell Party: December to Remember** held at **Pyramid Lounge, Ludhiana**.

---

## 💳 Payment & Approval Workflow

1. **Exact ₹2,000 Payment to Srishty**:
   - Each registration requires a **strict payment of exactly ₹2,000** (no more, no less).
   - The app features **Srishty's official UPI Payment QR Card**:
     - **UPI ID:** `9592982012@fam`
     - **Receiver Name:** Srishty
     - **One-Tap Payment Button:** Deep-links directly to GPay, PhonePe, Paytm, or FamPay with the prefilled amount `₹2,000`.
     - **Copy UPI Button:** Copies `9592982012@fam` to the clipboard.
   - The student enters their **12-digit UPI UTR / Transaction Reference number** upon payment.

2. **Pending Approval State**:
   - Immediately after registration, the ticket status is set to: **⏳ AWAITING SRISHTY'S APPROVAL**.
   - The movie ticket QR pass is **locked** and watermarked until Srishty confirms the payment.
   - A direct button allows the attendee to send their payment proof and UTR to **Srishty on WhatsApp** with a pre-filled confirmation message.

3. **👑 Srishty's Organizer Admin Portal**:
   - Accessible via the **"👑 Srishty Admin"** button in the header.
   - Protected by a PIN (default: `2026`).
   - Displays real-time stats:
     - **Pending Approvals Queue** with live counter badge.
     - **Total Confirmed Attendees**.
     - **Total Collected Revenue** (`₹2,000 × count`).
   - Srishty can:
     - Review the student's name, class, phone number, and UTR number.
     - Chat directly with the student on WhatsApp.
     - Click **✅ Approve & Issue Pass**:
       - Instantly unlocks the movie-ticket QR pass.
       - Triggers celebration confetti.
       - Enables high-resolution ticket download.
     - Click **❌ Reject**: If the UTR or amount doesn't match.

4. **Door Gate Scanner**:
   - Pyramid Lounge security can simulate scanning tickets at the door.
   - If an attendee's payment is still pending Srishty's review, entry is **denied**.
   - Once Srishty approves, the pass scans as **VALID** and checks the attendee into the lounge.

---

## 🚀 How to Run Locally

You can preview the app right now in any browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

Or start the server anytime:
```bash
cd /Users/ishika/Documents/Github/december-to-remember-tickets
python3 -m http.server 3000
```
