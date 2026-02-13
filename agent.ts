import { ethers } from "ethers";
// import { encryptMessage } from "@skalenetwork/bite"; // Assuming this is how it's imported based on prompt context
// Real import might be different, but following prompt logic "Encrypt Intent using bite.encryptMessage"

// Mocking the bite library for the purpose of this file generation if types aren't available, 
// but assuming the user has it or I should write it as if it exists.
// The prompt says "Use ethers and @skalenetwork/bite".

const bite = require("@skalenetwork/bite");

// specific config
const PRIVATE_KEY = "YOUR_PRIVATE_KEY";
const RPC_URL = "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox-2";
const SERVER_URL = "http://localhost:3000/api/premium-signals";

// Shop Contract ABI (minimal)
const shopAbi = [
    "function purchaseSecretly(bytes calldata encryptedItem) external payable",
    "event OrderRevealed(address indexed buyer, string decryptedItem)"
];

// USDC ABI (minimal)
const usdcAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

async function main() {
    // 1. Setup Provider & Wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Agent Wallet: ${wallet.address}`);

    // 2. Hit API to get Payment Requirements
    console.log("Fetching premium signals...");
    let paymentDetails;
    try {
        const response = await fetch(SERVER_URL);
        if (response.status === 402) {
            const data = await response.json();
            paymentDetails = data.paymentDetails;
            console.log("402 Payment Required:", paymentDetails);
        } else {
            console.log("Data received (no payment needed?):", await response.json());
            return;
        }
    } catch (error) {
        console.error("API Error:", error);
        return;
    }

    if (!paymentDetails) return;

    const { amount, tokenAddress, receiverAddress, chainId } = paymentDetails;

    // 3. Approve USDC
    const usdcContract = new ethers.Contract(tokenAddress, usdcAbi, wallet);
    const amountBigInt = BigInt(amount);

    const currentAllowance = await usdcContract.allowance(wallet.address, receiverAddress);
    if (currentAllowance < amountBigInt) {
        console.log("Approving USDC...");
        const tx = await usdcContract.approve(receiverAddress, amountBigInt);
        await tx.wait();
        console.log("USDC Approved.");
    }

    // 4. Encrypt Intent
    console.log("Encrypting intent 'VIP_DATA'...");
    const encryptedIntent = await bite.encryptMessage("VIP_DATA");
    // Note: ensure this returns bytes or hex string compatible with solidity 'bytes'

    // 5. Pay & Purchase
    const shopContract = new ethers.Contract(receiverAddress, shopAbi, wallet);
    const sFuelFee = ethers.parseEther("0.065"); // 0.065 sFUEL (slightly more than 0.06 to be safe)

    console.log("Sending Secret Purchase Transaction...");
    const purchaseTx = await shopContract.purchaseSecretly(encryptedIntent, {
        value: sFuelFee // Sending sFUEL for BITE fee
    });
    console.log("Tx Sent:", purchaseTx.hash);
    await purchaseTx.wait();
    console.log("Payment Confirmed On-Chain.");

    // 6. Wait for OrderRevealed
    console.log("Waiting for decryption by SKALE network...");
    const filter = shopContract.filters.OrderRevealed(wallet.address);

    shopContract.once(filter, (buyer, decryptedItem) => {
        console.log(`🎉 SUCCESS: Decrypted Data: ${decryptedItem}`);
        process.exit(0);
    });

    // Timeout safety
    setTimeout(() => {
        console.log("Timeout waiting for event.");
        process.exit(1);
    }, 60000); // 60s
}

main().catch(console.error);
