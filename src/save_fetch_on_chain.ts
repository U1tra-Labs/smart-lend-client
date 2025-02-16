import { Connection, Keypair, PublicKey, Transaction, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers"; // Assuming you're using this to load a keypair
import * as fs from "fs";

// Replace with Solend's actual Program ID
const SOLEND_PROGRAM_ID = new PublicKey("SolendProgramID1234567890abcdef"); // Use the correct Solend program ID
const RESERVE_LIST_ACCOUNT = new PublicKey("ReserveListAccountPublicKey1234567890abcdef"); // Replace with actual account address

export async function fetchSolendReserves() {
    // Load Keypair
    const keypair = await getKeypairFromFile("/Users/chester/.config/solana/id.json");
    console.log(`Public Key: ${keypair.publicKey.toBase58()}`);

    // Set up Solana connection
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    // Create transaction
    const tx = new Transaction();

    // Create instruction to interact with Solend's program (fetch reserves in this case)
    const fetchReservesInstruction = new TransactionInstruction({
        programId: SOLEND_PROGRAM_ID,
        keys: [
            { pubkey: keypair.publicKey, isSigner: true, isWritable: false },
            { pubkey: RESERVE_LIST_ACCOUNT, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([]), // Empty buffer or data to fetch reserves
    });

    // Add instruction to transaction
    tx.add(fetchReservesInstruction);

    // Send transaction
    const signature = await connection.sendTransaction(tx, [keypair]);
    console.log(`Transaction sent: ${signature}`);

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature);
    console.log(`Transaction confirmed: ${confirmation.value}`);
}

// Execute function
fetchSolendReserves().catch(console.error);