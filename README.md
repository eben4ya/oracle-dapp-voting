# Oracle DApp Voting

> 🔍 A Node.js Oracle that listens to on-chain events and syncs with backend.

---

## 📦 Repository Structure

```
oracle-dapp-voting/
├── src/
│   ├── index.js       # Main listener script & Fetch HR database eligibility
├── package.json
└── README.md          # (this file)
```

---

## 🔗 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/eben4ya/oracle-dapp-voting.git
cd oracle-dapp-voting
```

### 2. Update submodules (if any)

If this repo contains submodules, run:

```bash
git submodule init
git submodule update --init --recursive
```

---

## 🧩 How It Works

1. **Event: VotingSessionCreated**

   - Oracle listens to on-chain `VotingSessionCreated(sessionId, start, end)`.
   - When triggered, Oracle fetches all employee records from the HR database.
   - It filters employees with attendance ≥ 75% and updates eligibility on-chain by calling `updateEligibility(sessionId, eligibleVoters, true)` (or writes to backend).

2. **Event: CandidateRegistered**

   - Oracle listens to on-chain `CandidateRegistered(sessionId, candidateAddr, name)`.
   - When triggered, Oracle sends a POST request to the backend:

     ```http
     POST /api/oracle/candidate
     Content-Type: application/json

     {
       "sessionId": "1",
       "candidateAddr": "0x1234...abcd",
       "candidateName": "Alice",
     }
     ```

   - Backend stores the candidate details in its database.

---

## ⚙️ Quick Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` file in root:

   ```ini
   RPC_URL=https://sepolia.infura.io/v3/[ID]
   PRIVATE_KEY=0xYOUR_ADMIN_PRIVATE_KEY
   CONTRACT_ADDRESS=0xYourContractAddress
   BACKEND_URL=http://localhost:3000
   ```

3. Start the Oracle service:

   ```bash
   npm run dev
   ```

   - The Oracle connects to the blockchain via `RPC_URL`.
   - It listens for both `VotingSessionCreated` and `CandidateRegistered`.
   - Eligibility logic (attendance ≥ 75%) is handled in `src/index.js`.
   - On `CandidateRegistered`, Oracle POSTs candidate data to `BACKEND_URL`.

---
