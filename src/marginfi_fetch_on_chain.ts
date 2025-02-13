import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptAccount, getAccount, createAssociatedTokenAccount } from "@solana/spl-token";
import * as fs from "fs";
import { AnchorProvider, BN, Program, Wallet, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { getSolBalance, getUsdcBalance } from "./helper"; 

const PROGRAM_ID = new PublicKey("MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA");
const IDL_PATH = "src/idl/marginfi.json"; // Path to the IDL file
const MARGINFI_GROUNP = new PublicKey("9QLbErzeDKmy33wtFscQ6gUNRV2NNnWYHDRELUxxbQyv");
const MARGINFI_GROUNP1 = new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8");
const MARGINFI_USDC_BANK = new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB");
const MARGINFI_USDC_LIQUIDITY_VAULT = new PublicKey("7jaiZR5Sk8hdYN9MxTpczTcwbWpb5WEoxSANuUwveuat");


export async function marginfi_fetch_on_chain() {

    const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));
    const keypair = await getKeypairFromFile("/Users/chester/.config/solana/id.json");
    console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

    const wallet = new Wallet(keypair);
    let signer = wallet.publicKey;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new Program(idl, PROGRAM_ID, provider);


    //Step1. Initialize the marginfi account
    const MY_MARGIN_ACCOUNT = new PublicKey("5fHx5arkPyNmZFYk7kWiazrAFn7jzhQxTXkwHvEnQra");
    const marginfiAccountKeypair = Keypair.generate();
    console.log("accountKeypair: ", marginfiAccountKeypair.publicKey.toBase58());

    const tx_initial_account_state = await program.methods
        .marginfiAccountInitialize()
        .accounts({
            marginfiGroup: MARGINFI_GROUNP1,
            marginfiAccount: marginfiAccountKeypair.publicKey,
            authority: wallet.publicKey,
            feePayer: wallet.publicKey,
        })
        .signers([wallet.payer, marginfiAccountKeypair]) 
        .rpc({ commitment: "confirmed" });

    console.log(`Transactoin: ${tx_initial_account_state}`);

    getSolBalance(wallet.publicKey);
    getUsdcBalance(wallet.publicKey);
    // Step 2. Deposit

    const tokenMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mint address of the token (e.g., USDC)
    const usdcTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
    console.log("singer token account", usdcTokenAccount);

    const amount = 1 * 100_000;

    const tx_deposit = await program.methods
        .lendingAccountDeposit(new BN(amount))
        .accounts({
            marginfiGroup: MARGINFI_GROUNP1,
            marginfiAccount: MY_MARGIN_ACCOUNT,
            signer: wallet.publicKey,
            signerTokenAccount: usdcTokenAccount,
            bank: MARGINFI_USDC_BANK,
            bankLiquidityVault: MARGINFI_USDC_LIQUIDITY_VAULT,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });

    console.log(`Deposit Transaction: ${tx_deposit}`);

    getUsdcBalance(wallet.publicKey);

       
}

