# 🚆 RailPulse - Production-Ready Smart Railway Reservation & Telemetry Platform

RailPulse is a complete, state-of-the-art Railway Reservation & Smart Train Management Platform built with modern web technologies: HTML5, CSS3, Bootstrap 5, JavaScript (ES6+), Node.js, REST APIs, WebSockets / SSE for real-time telemetry, Leaflet.js maps, Chart.js analytics, QRCode.js, jsPDF, and Glassmorphism UI design.

---

## 🌟 Key Features

### 1. 🎟️ Passenger Portal & Ticket Reservation
- **Dynamic Train Search**: Search by origin, destination, departure date, passenger count, travel class (1A, 2A, 3A, SL, EC, CC), and booking quota (General, Tatkal, Ladies, Senior).
- **Interactive Seat Selection Engine**: Visual coach layout map (Engine, AC 1st, 2-Tier, 3-Tier, Sleeper) with color-coded seats:
  - 🟢 **Green**: Available
  - 🔴 **Red**: Occupied
  - 🔵 **Blue**: Selected
  - 🔘 **Gray**: Disabled
- **Passenger Information Form**: Collects multi-passenger details, age, gender, berth preference (Lower, Middle, Upper, Side), meal choice (Veg, Non-Veg, Jain), and emergency contacts.
- **Multi-Payment Gateway Simulator**: Credit/Debit Cards, UPI (GPay/PhonePe), Net Banking, and Rail Wallet with price breakdown (Base fare, GST 5%, IRCTC fee, optional travel insurance).
- **Instant Booking Confirmation**: Auto-generates PNR (10-digit), Booking ID, QR Code, barcode, seat assignments, and downloadable official **PDF Ticket** via jsPDF.

### 2. 🗺️ Live GPS Train Tracking Map (Leaflet.js)
- Interactive Leaflet.js map with light/dark/satellite tiles.
- Custom animated SVG train marker moving smoothly along geographical polyline routes between major Indian railway hubs.
- Station markers with hover popups displaying current speed, engine temperature, status, and platform numbers.

### 3. 📊 Locomotive Telemetry & Analytics Dashboard
- Live streaming CAN-bus metrics via Server-Sent Events (SSE):
  - **Current Speed & Max Limit** (km/h)
  - **Engine Temperature** (°C)
  - **Traction Power Consumption** (kWh)
  - **Coach Occupancy Percentage & Onboard Passengers**
- Dynamic real-time Chart.js speed and power consumption graphs.
- Safety & Brake system status indicators (KAVACH anti-collision, pneumatic pressure, axle temp).

### 4. 🛈 Airport-Style Live Station Departure Board
- Airport-style departure & arrival flip-board table.
- Real-time updates with status badges (`ON TIME`, `BOARDING`, `DELAYED`, `DEPARTED`).

### 5. 🤖 AI Delay Predictor & Multi-Route Trip Planner
- Predictive model evaluating Weather (Clear, Rain, Fog, Storm), Track Density %, Peak Hours, and Maintenance work.
- Displays Delay Probability %, Confidence Score %, Risk Level (Low/Med/High), and Smart Alternative Routes.

### 6. 🛡️ Admin Control Panel
- Secure Admin login & statistics cards:
  - Total Users, Active Trains, Daily/Monthly Revenue, Cancellation & Occupancy Rates.
- Management Tabs:
  - **Train Inventory CRUD**: Add new trains, update routes, fares, and delete trains.
  - **Bookings Manifest**: Inspect all passenger records and PNR statuses.
  - **System Audit Logs**: Track security events, signups, and bookings.
  - **Data Exporter**: One-click CSV dataset download.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)

### Running the Server

To start the server:

```bash
node server.js
```

Then open your browser and navigate to:
```text
http://localhost:3000
```

---

## 📁 Project Structure

```text
railway-system/
├── data/
│   └── db.json                # Seed database (Users, Trains, Stations, Bookings, Audit Logs)
├── public/
│   ├── index.html             # Single Page Application HTML5 structure
│   ├── css/
│   │   └── style.css          # Glassmorphism design system, dark mode, animations
│   └── js/
│       ├── api.js             # API service layer & JWT state manager
│       ├── app.js             # Core app router & search controller
│       ├── seat-picker.js     # Visual coach layout & seat selector engine
│       ├── map-tracker.js     # Leaflet.js live train GPS tracking
│       ├── telemetry.js       # Chart.js engine metrics & circular gauges
│       ├── station-board.js   # Airport-style split-flap departure board
│       ├── delay-predictor.js # AI delay forecast model
│       └── admin.js           # Admin dashboard, inventory CRUD & CSV export
├── server.js                  # Node.js core REST & SSE server
├── seed.js                    # Database seed validator
└── package.json               # Package specification
```

---

## 🔑 Demo Account Credentials

- **Admin Account**:
  - Email: `admin@railpulse.com`
  - Password: `admin123`

- **Passenger Account**:
  - Email: `rahul.sharma@example.com`
  - Password: `passenger123`
