
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createAssociatedTokenAccountInstruction} from "@solana/spl-token";
import * as fs from "fs";
import { AnchorProvider, BN, Program, Wallet, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { getAssociatedTokenAddress} from "@solana/spl-token";

export async function CreateATA(connection: Connection, wallet: Wallet, userUSDCAccount: PublicKey, USDC_MINT: PublicKey) {

    console.log("Creating new ATA for user...");

    const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // Payer (wallet public key)
          userUSDCAccount, // Associated token account address
          wallet.publicKey, // Token owner
          USDC_MINT // Token mint address
        )
      );
    
      // Send transaction
    const signature = await sendAndConfirmTransaction(
        connection, // First argument should be the connection
        transaction, // Transaction object
        [wallet.payer], // Signers (payer must sign)
        { skipPreflight: false, commitment: "confirmed" }
    );

    return signature;
    
}



export async function getSolBalance(address: PublicKey) {
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    const publicKey = address;

    const balance = await connection.getBalance(publicKey);
    console.log(`SOL Balance: ${balance / 1_000_000_000} SOL`); // Convert from lamports to SOL
}

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export async function getUsdcBalance(address: PublicKey) {
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

    // Derive the Associated Token Account (ATA) for USDC
    const usdcAta = await getAssociatedTokenAddress(USDC_MINT, address);

    console.log(usdcAta)
    // Fetch account info
    const accountInfo = await connection.getTokenAccountBalance(usdcAta);

    // If the account does not exist, it means the user has no USDC balance
    if (!accountInfo || !accountInfo.value) {
        console.log("No USDC balance found.");
        return;
    }

    console.log(`USDC Balance: ${accountInfo.value.uiAmount} USDC`);
}

   