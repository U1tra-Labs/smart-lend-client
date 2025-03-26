import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { getAssociatedTokenAddress, getMinimumBalanceForRentExemptAccount, getAccount, createAssociatedTokenAccount } from "@solana/spl-token";
import * as fs from "fs";
import { AnchorProvider, BN, Program, Wallet, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { CreateATA } from "./helper";

const PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");
const IDL_PATH = "src/idl/drift.json"; // Path to the IDL file
const WSOL_TOKEN_ACCOUNT = new PublicKey("9ou1jn8C1JxABRqCj5k86tnHr9R1TADumcPPrVKpzuhA");

export async function drfit_fetch_on_chain() {

    const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));

    const keypair = await getKeypairFromFile("/Users/chester/.config/solana/id.json");

    console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const version = await connection.getVersion();
    console.log("Connected to Solana:", version);

    const wallet = new Wallet(keypair);
    let signer = wallet.publicKey;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

    const program = new Program(idl, PROGRAM_ID, provider);

    //Step1. Initialize the user account

    // Find PDA for User Account

    const [userStatsPDA, statsBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_stats"), wallet.publicKey.toBuffer()],
        program.programId
    );

    const [userPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), wallet.publicKey.toBuffer(), new BN(0).toArrayLike(Buffer, "le", 2)],
        program.programId
    );

    //find on the brower, easy to find
    const DRIFT_STATE = new PublicKey("5zpq7DvB6UdFFvpmBPspGPNfUGoBRRCE2HHg5u3gxcsN");
    const DRIFT_VAULT = new PublicKey("JCNCMFXo5M5qwUPg2Utu1u6YWp3MbygxqBsBeXXJfrw");


    console.log(`User PDA: ${userPDA.toBase58()}`);
    console.log(`User Stats PDA: ${userStatsPDA.toBase58()}`);

    const nameBuffer = Buffer.alloc(32);

    // const tx_user_state = await program.methods
    //     .initializeUserStats()
    //     .accounts({
    //         userStats: userStatsPDA,
    //         state: DRIFT_STATE,
    //         authority: wallet.publicKey,
    //         payer: wallet.publicKey,
    //         rent: web3.SYSVAR_RENT_PUBKEY,
    //         systemProgram: web3.SystemProgram.programId,
    //     })
    //     .rpc();

    // const tx_init_user = await program.methods.initializeUser(new BN(0), nameBuffer)
    //     .accounts({
    //         user: userPDA,
    //         userStats: userStatsPDA,
    //         state: DRIFT_STATE,
    //         authority: signer,
    //         payer: signer,
    //     }).rpc({ commitment: "confirmed" });

    // console.log("User Account Initialized:", tx_init_user);


    //Step 2. Get Wrapped Sol

    const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); 
    const USDC_MINT = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");
    const USDC_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

    const userWSOLAccount = await getAssociatedTokenAddress(WSOL_MINT, wallet.publicKey);
    console.log("Your WSOL Token Account:", userWSOLAccount.toBase58());

    const userUSDCAccount = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
    console.log("Your USDC Token Account:", userUSDCAccount.toBase58());

    // const signature = CreateATA(connection, wallet, userUSDCAccount, USDC_MAINNET);
    // console.log("ATA Signature:", signature);

    const rentExemption = await getMinimumBalanceForRentExemptAccount(connection);
    const amountToWrap = 1 * LAMPORTS_PER_SOL; // Wrap 1 SOL into WSOL

    // const transaction = new Transaction()
    //     .add(
    //         // Create WSOL token account if not exists
    //         createAssociatedTokenAccountInstruction(wallet.publicKey, userWSOLAccount, wallet.publicKey, WSOL_MINT),
    //         // Transfer SOL to WSOL token account
    //         SystemProgram.transfer({
    //             fromPubkey: wallet.publicKey,
    //             toPubkey: userWSOLAccount,
    //             lamports: amountToWrap + rentExemption, // Include rent exemption
    //         }),
    //         // Sync WSOL balance
    //         createSyncNativeInstruction(userWSOLAccount)
    //     );

    // await sendAndConfirmTransaction(connection, transaction, [wallet.payer]);

    // console.log("Wrapped 1 SOL into WSOL:", userWSOLAccount.toBase58());
    
    const usdcAccount = await getAccount(connection, userUSDCAccount);
    console.log("USDC Balance:", Number(usdcAccount.amount) / 1000000, "USDC");

    //Step 2. Deposit

    const market_index = 0;
    const amount = 0.1;
    const reduceOnly = false;

    const [spotMarketVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("spot_market_vault"), new BN(0).toArrayLike(Buffer, "le", 2)],
        program.programId
    );

    console.log("Spot Market Vault PDA:", spotMarketVaultPDA.toBase58());
    const vaultInfo = await connection.getAccountInfo(spotMarketVaultPDA);
    console.log(`Spot Market Vault Exists: ${!!vaultInfo}`);

    const oracleReceiver = new PublicKey("En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce");
    const spotMarketAccount = new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"); // Confirm this is correct!


    // const tx_deposit = await program.methods
    //     .deposit(
    //         new BN(market_index),
    //         new BN(amount * 1000000),
    //         reduceOnly
    //     )
    // .accounts({
    //     state: DRIFT_STATE,
    //     user: userPDA,
    //     userStats: userStatsPDA,
    //     authority: wallet.publicKey,
    //     spotMarketVault: spotMarketVaultPDA,
    //     userTokenAccount: userUSDCAccount,
	// 	tokenProgram: TOKEN_PROGRAM_ID,
    // })
    // .remainingAccounts([
    //     { pubkey: oracleReceiver, isSigner: false, isWritable: false },
    //     { pubkey: spotMarketAccount, isSigner: false, isWritable: true }, // This might be writable
    // ])
    // .rpc({commitment: "confirmed"});

    // console.log("Deposited Transaction:", tx_deposit);  


    const tx_withdraw = await program.methods
        .withdraw(
            new BN(market_index),
            new BN(amount * 1000000),
            reduceOnly
        ).accounts({
            state: DRIFT_STATE,
            user: userPDA,
            userStats: userStatsPDA,
            authority: wallet.publicKey,
            spotMarketVault: spotMarketVaultPDA,
            driftSigner: DRIFT_VAULT,
            userTokenAccount: userUSDCAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
        })  
        .remainingAccounts([
        { pubkey: oracleReceiver, isSigner: false, isWritable: false },
        { pubkey: spotMarketAccount, isSigner: false, isWritable: true }, // This might be writable
        ]).
        rpc();

    console.log("Withdraw Transaction:", tx_withdraw);

}

