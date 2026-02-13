# 🦅 ShadowPay Agent

**Privacy-Preserving Payment Gateway for AI Agents on SKALE**

ShadowPay enables AI agents to make confidential purchases on-chain using the **SKALE BITE (Blockchain Integration & Trusted Execution)** protocol. It allows buyers to encrypt their purchase intent (e.g., an API key request, a trade signal subscription) so that even the merchant contract cannot see it until payment is confirmed and the network decrypts it.

---

## 🚀 Features

- **Confidential Intents**: Purchase details are encrypted client-side using BITE.
- **Trustless Decryption**: The SKALE network decrypts the intent only after payment is finalized.
- **AI Agent Integration**: A fully automated TypeScript agent that handles allowance, payments, and encryption.
- **Robust Event Polling**: Handles network latency and RPC issues with custom polling logic.
- **Hackathon Simulation Mode**: Includes a fallback simulation for demonstration purposes if the testnet BITE node is unresponsive.

---

## 🛠️ Technology Stack

- **Blockchain**: SKALE Network (BITE v2 Sandbox)
- **Smart Contracts**: Solidity, Foundry
- **Agent**: TypeScript, ethers.js v6
- **Server**: Node.js, Express
- **Encryption**: @skalenetwork/bite SDK

---

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mandip-kamaliya/ShadowPay-agent.git
   cd "ShadowPay Agent"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

---

## ⚙️ Configuration

### Smart Contract (`src/PrivateShop.sol`)
The contract is already deployed to the SKALE BITE Sandbox.
- **Address**: `0x3A739F1Aae4E2E17476f94Aa581A29035d44184f`

### Agent Configuration (`agent.ts`)
The agent script includes a hardcoded private key **for demonstration purposes only**.
- In a production environment, use environment variables (`.env`).
- **Secret Message**: You can change `const secretMessage = "VIP_DATA";` on line ~73 to test different encrypted payloads.

---

## 🏃 Usage

### 1. Start the Merchant Server
The server listens for incoming requests and monitors the blockchain for decrypted orders.

```bash
node server.js
```
*Keep this terminal open.*

### 2. Run the AI Agent
Open a new terminal and run the agent. It will fetch the price, approve USDC, encrypt its order, and execute the transaction.

```bash
npx ts-node agent.ts
```

---

## 🔄 The Flow

1. **Agent** asks Server for price.
2. **Server** responds with `402 Payment Required` (Generic Paywall).
3. **Agent** encrypts secret data (`VIP_DATA`) using SKALE BITE.
4. **Agent** sends transaction with payment + encrypted data to `PrivateShop`.
5. **PrivateShop** forwards the encrypted data to the **BITE Precompile**.
6. **SKALE Network** validates and decrypts the data.
7. **PrivateShop** receives the callback `onDecrypt` and emits `OrderRevealed`.
8. **Agent & Server** detect the event and confirm the purchase.

---

## ⚠️ Troubleshooting

**"Network Timeout" / Simulation Mode**
The SKALE BITE Sandbox testnet can occasionally experience latency with its decryption nodes.
- If the agent does not receive the decryption event within ~45 seconds, it will automatically switch to **Simulation Mode**.
- This mimics the successful event verify the flow for demos, ensuring your presentation is seamless.

---

## 📜 Contract Address

**PrivateShop**: `0x3A739F1Aae4E2E17476f94Aa581A29035d44184f`
**USDC (Testnet)**: `0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8`

---

*Built for the Hackathon 2025*
