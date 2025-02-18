
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
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

   
/**
 * Function to create an Associated Token Account (ATA) for WSOL
 * @param {PublicKey} wallet - The wallet (payer) that will own the ATA
 * @param {PublicKey} wsomMint - The mint address of the token (WSOL)
 * @returns {Promise<string>} - The signature of the transaction that creates the ATA
 */
export async function createWsolAta(
    wallet: Wallet,
    wsomMint: PublicKey,
): Promise<string> {
    // Find the Associated Token Address (ATA)
    const wsolATA = await getAssociatedTokenAddress(wsomMint, wallet.publicKey);

    console.log("WSOL ATA Address:", wsolATA.toBase58());

    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

    // Check if the ATA exists or not (no-op if exists)
    try {
        await connection.getAccountInfo(wsolATA);
        console.log("WSOL ATA already exists");
        return "ATA already exists"; // Exit early if ATA already exists
    } catch (e) {
        console.log("WSOL ATA does not exist, creating...");
    }

    // Create the instruction if ATA does not exist
    const createAtaIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey, // Payer (who pays for the account creation)
        wsolATA,          // Associated Token Account
        wallet.publicKey, // Token Account Owner
        wsomMint          // Token Mint Address
    );

    // Prepare and send the transaction
    const blockhashWithContext = await connection.getLatestBlockhash();
    const tx = new Transaction({
        feePayer: wallet.publicKey,
        blockhash: blockhashWithContext.blockhash,
        lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    }).add(createAtaIx);

    const signature = await sendAndConfirmTransaction(
        connection, 
        tx, 
        [wallet.payer]
    );
    console.log("Create WSOL ATA Transaction Signature:", signature);

    return signature;
}


/**
 * Create a new account with a seed using the System Program.
 *
 * @param payer - The account paying for the transaction.
 * @param newAccount - The new account to be created.
 * @param owner - The program that will own the new account.
 * @param base - The base public key for the seed derivation.
 * @param seed - The seed to create the new account.
 * @param space - The space required for the new account (usually based on the account's data structure).
 * @param lamports - The number of lamports to fund the new account.
 * @returns The instruction to create the new account.
 */
export function createAccountWithSeedInstruction(
    payer: PublicKey,
    newAccount: PublicKey,
    owner: PublicKey,
    base: PublicKey,
    seed: string,
    space: number,
    lamports: number
): TransactionInstruction {
    
    return SystemProgram.createAccountWithSeed({
        fromPubkey: payer,
        newAccountPubkey: newAccount,
        basePubkey: base,
        seed: seed,
        lamports: lamports,
        space: space,
        programId: owner, // Program ID that will own the new account
    });
}