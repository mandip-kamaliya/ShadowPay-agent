const express = require('express');
const { ethers } = require('ethers');

const app = express();
const PORT = 3000;

// Configuration
const RPC_URL = "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2";
const SHOP_CONTRACT_ADDRESS = "0x3A739F1Aae4E2E17476f94Aa581A29035d44184f";
const USDC_ADDRESS = "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8";
const CHAIN_ID = 1351057110;

const shopAbi = [
    "event OrderRevealed(address indexed buyer, string decryptedItem)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
// Explicitly disable polling to prevent internal eth_getFilterChanges calls if they are causing issues
provider.pollingInterval = 10000;

const shopContract = new ethers.Contract(SHOP_CONTRACT_ADDRESS, shopAbi, provider);

app.get('/api/premium-signals', (req, res) => {
    const hasPayment = false;

    if (!hasPayment) {
        res.set('X-Payment-Required', 'true');
        return res.status(402).json({
            error: "Payment Required",
            paymentDetails: {
                chainId: 1351057110,
                amount: "1000000", // 1.0 USDC
                tokenAddress: USDC_ADDRESS,
                receiverAddress: SHOP_CONTRACT_ADDRESS
            }
        });
    }

    res.json({ signal: "ETH is going to the moon! 🚀" });
});

// Background Listener (Robust Polling)
async function startListener() {
    console.log("Starting listener for OrderRevealed events (Polling mode)...");
    let lastBlock = await provider.getBlockNumber();

    setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            if (currentBlock > lastBlock) {
                // Query events
                // Using try-catch for queryFilter specifically
                try {
                    const events = await shopContract.queryFilter("OrderRevealed", lastBlock + 1, currentBlock);
                    for (const event of events) {
                        const { buyer, decryptedItem } = event.args;
                        console.log(`💰 PAYMENT CONFIRMED: Unlocking data for [${buyer}]...`);
                        console.log(`   Data: ${decryptedItem}`);
                    }
                } catch (e) {
                    console.error("Error querying logs:", e.message);
                }
                lastBlock = currentBlock;
            }
        } catch (error) {
            console.error("Polling loop error:", error.message);
        }
    }, 5000);
}

// Global Error Handlers to prevent crash
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startListener();

app.listen(PORT, () => {
    console.log(`Merchant API listening on port ${PORT}`);
});
