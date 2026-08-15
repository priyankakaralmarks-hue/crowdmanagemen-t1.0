# ResourceSync: Crowd-Sourced Explainable Resource Allocation Platform

> A full-stack web application engineered to allocate scarce, limited resources fairly, democratically, and transparently when demand exceeds supply.

---

## 📌 Project Objective

In disaster response, emergency medical triage, non-profit community aid, and high-demand organizational environments, critical resources (e.g., laptops, generators, trauma kits, filtration units) are strictly limited. Traditional allocation either operates as an opaque "black box" or suffers from pure popularity contests where the most popular user receives items regardless of urgency or operational feasibility.

**ResourceSync** solves this by uniting **multi-factor urgency weighting**, **peer community consensus voting**, and **real-time resource availability** into a **100% transparent and explainable ranking engine**. Every stakeholder—from normal users to executive administrators—can inspect exact mathematical point breakdowns and natural language rationales for every single ranking position.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modern SPA, component modularity, lightning-fast HMR |
| **Styling** | Tailwind CSS + Lucide Icons | Responsive glassmorphic UI, status badges, factor meters |
| **Routing** | React Router v6 | Role-based protected routes (`/admin` vs `/dashboard`) |
| **Backend** | Node.js + Express | RESTful API, transactional integrity, centralized error handling |
| **Database** | SQLite 3 via `sql.js` (Pure JS) | Relational schemas, foreign keys, unique constraints, zero native C++ compiler dependency |
| **Security** | JWT + `bcryptjs` | Stateless token authentication, salted password hashing |

---

## 👥 User Roles & Permissions

### 1. 👑 Executive Administrator (`role = 'admin'`)
- **Resource Management**: Add new pool items, edit specifications, adjust total/available stock, delete non-referenced items.
- **Ranked Allocation Action Center**: Review live ranked queues and trigger atomic allocations.
- **Audit Registry**: View all requests across users with multi-dimensional filters (Urgency, Status, Resource).
- **Immutable History Log**: Inspect all past fulfillments with timestamp, recipient identity, notes, and authorized officer.
- **Inventory Protection**: Backend strictly prevents allocating more items than available or double-allocating requests.

### 2. 👤 Normal User (`role = 'user'`)
- **Browse Catalog**: View available inventory with real-time stock status (`In Stock`, `Low Stock`, `Out of Stock`).
- **Submit Demands**: Request resources with defined quantities, urgency levels (`Critical`, `High`, `Medium`, `Low`), and field justifications.
- **My Demands Dashboard**: Real-time status tracking (`Pending`, `Allocated`, `Rejected`), priority scores, and live ranking position.
- **Explainability Audit ("Why this rank?")**: Click any request to open a detailed point-by-point scoring breakdown modal.
- **Community Peer Voting**: Upvote peer requests to prioritize urgent needs.
  - 🚫 **Self-voting rule**: A user can never vote on their own request (`«You cannot vote for your own request.»`).
  - 🔒 **Duplicate prevention**: 1 vote per request per user enforced via database unique constraints.

---

## 🧮 Explainable Ranking Algorithm

The priority score is computed dynamically on a 0 to 100 scale using three transparent, normalized factors:

$$\text{Priority Score} = \text{Urgency Score (50\%)} + \text{Community Vote Score (30\%)} + \text{Resource Availability Score (20\%)}$$

### Factor 1: Urgency Level ($W_u = 50\%$, Max 50.0 pts)
Urgency reflects immediate operational or humanitarian severity:
- **`Critical`** $\rightarrow$ **$+50.0\text{ pts}$** (Active hazard, emergency medical triage, zero-delay crisis)
- **`High`** $\rightarrow$ **$+37.5\text{ pts}$** (Time-sensitive community requirement)
- **`Medium`** $\rightarrow$ **$+25.0\text{ pts}$** (Standard planned rollout, scheduled deployment)
- **`Low`** $\rightarrow$ **$+12.5\text{ pts}$** (Flexible timeline, routine upgrade)

### Factor 2: Community Support ($W_v = 30\%$, Max 30.0 pts)
Peer voting ensures democratic validation without devolving into a pure popularity contest:
$$\text{Vote Score} = \min\left(30.0, \frac{\text{votes}}{\max(V_{\text{benchmark}}, 5)} \times 30.0\right)$$
- If a request has 0 votes: $+0.0\text{ pts}$.
- Smooth scaling prevents monopolies while honoring community backing.

### Factor 3: Resource Availability & Capacity ($W_a = 20\%$, Max 20.0 pts)
Rewards demands that can be fulfilled immediately without creating catastrophic inventory strain:
- If $\text{Available} \ge \text{Requested}$:
  - Minimal stock strain ($\text{Requested} \le 0.5 \times \text{Available}$): **$+20.0\text{ pts}$** (`Sufficient`)
  - Moderate stock strain ($\text{Requested} > 0.5 \times \text{Available}$):
    $$\text{Score} = 10.0 + 10.0 \times \left(\frac{\text{Available} - \text{Requested}}{\text{Available}}\right)\text{ pts} \quad (\text{`Limited`})$$
- If $\text{Available} < \text{Requested}$ or $\text{Available} \le 0$: **$+0.0\text{ pts}$** (`Deficit / Out of Stock`)

### Dynamic Natural Language Explanation Generator
Explanations are generated dynamically from computed values (never hard-coded). For example:
> *"This request is ranked #1 with a priority score of 94.0/100 because it combines critical urgency (+50.0 pts), strong community support of 4 votes (+24.0 pts), and sufficient resource inventory (+20.0 pts)."*

---

## 🗄️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Resources
CREATE TABLE resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL CHECK(total_quantity >= 0),
  available_quantity INTEGER NOT NULL CHECK(available_quantity >= 0),
  allocated_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Requests (Demands)
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resource_id INTEGER NOT NULL,
  requested_quantity INTEGER NOT NULL CHECK(requested_quantity > 0),
  urgency TEXT NOT NULL CHECK(urgency IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  description TEXT,
  votes_count INTEGER NOT NULL DEFAULT 0,
  priority_score REAL NOT NULL DEFAULT 0,
  ranking_position INTEGER DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'allocated', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  allocated_at DATETIME DEFAULT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(resource_id) REFERENCES resources(id)
);

-- Votes (Unique constraint enforces 1 vote per user per request)
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  request_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, request_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(request_id) REFERENCES requests(id)
);

-- Allocations Audit Log
CREATE TABLE allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  resource_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  allocated_quantity INTEGER NOT NULL CHECK(allocated_quantity > 0),
  allocated_by_user_id INTEGER NOT NULL,
  notes TEXT,
  allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES requests(id),
  FOREIGN KEY(resource_id) REFERENCES resources(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(allocated_by_user_id) REFERENCES users(id)
);
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install & Build
From the project root:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies & build static client
cd ../frontend
npm install
npm run build
```

### 2. Run Automated Test Suite
Verify database transactions, ranking algorithms, self-vote blocking, and over-allocation constraints:
```bash
cd backend
npm test
```

### 3. Start the Server
```bash
# From root or backend folder
npm start
```
Open your browser and navigate to: **`http://localhost:5000`**

---

## 🔑 Pre-Configured Demo Accounts

| Persona | Email | Password | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Officer** | `admin@allocator.com` | `admin123` | `admin` | Inventory control, approvals & allocation |
| **Alice Green** | `alice@example.com` | `user123` | `user` | Emergency response coordinator |
| **Bob Vance** | `bob@example.com` | `user123` | `user` | Field logistics manager |
| **Dr. Charlie Kelly** | `charlie@example.com` | `user123` | `user` | Healthcare outreach officer |

> **Pro Tip**: The application UI features a **1-Click Persona Switcher** in the top navigation bar to seamlessly test interactions between users without repetitive typing!

---

## 🎬 End-to-End Walkthrough Scenario

1. **Admin Adds Inventory**:
   - Log in as `admin@allocator.com`.
   - Add a resource: `Emergency Mobile Radios` (Total: `10`, Available: `10`).
2. **User A Submits Critical Request**:
   - Switch to `Alice Green`.
   - Submit request for `2 Radios` with `Critical` urgency (Reason: *"Search & rescue team deployment in Sector 7"*).
3. **User B Submits Medium Request**:
   - Switch to `Bob Vance`.
   - Submit request for `3 Radios` with `Medium` urgency (Reason: *"Warehouse inventory audit scheduled next week"*).
4. **Community Voting**:
   - Switch to `Dr. Charlie Kelly`.
   - Go to **Community Voting** and upvote Alice's request.
   - Switch to `Alice Green` $\rightarrow$ Notice Alice is blocked from voting on her own request with the indicator `«You cannot vote for your own request.»`.
5. **Explainable Ranking Calculation**:
   - Navigate to **Live Rankings**.
   - Alice is ranked **#1** with a composite score of ~94 pts.
   - Click **"Why this rank?"** to view the interactive breakdown (+50 Urgency, +24 Votes, +20 Availability).
6. **Admin Allocates Resource**:
   - Switch to `Admin Officer`.
   - Go to **Ranked Allocation Action Center**.
   - Click **Allocate Resource** on Alice's #1 ranked request.
7. **Verification & Audit History**:
   - Available radios immediately decrease from `10` to `8`, Allocated increases to `2`.
   - Alice's request status changes to `Allocated & Dispatched`.
   - Navigate to **Allocation History** to verify the permanent audit log entry.

---

## 🔮 Future Enhancements
- **Multi-criteria Geo-fencing**: Weight requests based on proximity to disaster epicenters.
- **Resource Depletion Forecasting**: Predictive machine learning to trigger procurement alerts before stockouts.
- **Exportable PDF Audit Reports**: One-click generation of formal compliance certificates for government and NGO audits.
