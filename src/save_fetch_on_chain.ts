import { createAccountWithSeedInstruction } from "./helper";
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { AnchorProvider, Provider, Wallet } from "@project-serum/anchor";
import { getKeypairFromFile } from "@solana-developers/helpers"; // Assuming you're using this to load a keypair
import * as fs from "fs";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";

const BufferLayout = require("buffer-layout");

const poolAddress = new PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp");
const solendProgramId = new PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
    

export async function save_fetch_on_chain() {

    const keypair = await getKeypairFromFile("/Users/chester/.config/solana/id.json");
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

    console.log(`Wallet Public Key: ${wallet.publicKey.toBase58()}`);

    // Solend program ID and obligation details
 
    const obligationAddress = await createSolendObligationAccount(wallet, provider);
    
    const Ix = initObligationInstruction(
        obligationAddress,
        poolAddress,
        wallet.publicKey,
        solendProgramId
    );


    const transaction = new Transaction();
    transaction.add(Ix);

    const sign = await sendAndConfirmTransaction(connection, transaction, [wallet.payer]);
    console.log("Transaction Signature:", sign);


}





/**
 * Creates an obligation account for Solend using `createAccountWithSeed`
 * Always returns a PublicKey of the created obligation account or throws an error.
 */
export async function createSolendObligationAccount(wallet: Wallet, provider: AnchorProvider): Promise<PublicKey> {
    try {
        // Load keypair and initialize wallet

        const payer = wallet.publicKey; // The fee payer
        const base = wallet.publicKey; // Base account used for seed derivation
        const space = 1300; // Space allocation for the account
        const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);

        // Pool address (used to derive the seed)
        const seed = poolAddress.toBase58().slice(0, 32);

        // Derive the obligation account address
        const obligationAddress = await PublicKey.createWithSeed(wallet.publicKey, seed, solendProgramId);
        console.log(`Derived Obligation Address: ${obligationAddress.toBase58()}`);

        // Check if the account already exists
        const obligationAccountInfo = await provider.connection.getAccountInfo(obligationAddress, "processed");

        if (obligationAccountInfo) {
            console.log(`Obligation account already exists: ${obligationAddress.toBase58()}`);
            return obligationAddress; // Return the existing obligation address
        }

        // Create the instruction to initialize the account
        const createAccountIx = createAccountWithSeedInstruction(
            payer,
            obligationAddress,
            solendProgramId,
            base,
            seed,
            space,
            lamports
        );

        // Create and send transaction
        const transaction = new Transaction().add(createAccountIx);
        const signature = await sendAndConfirmTransaction(
            provider.connection,
            transaction,
            [wallet.payer],
            { skipPreflight: true }
        );

        console.log(`✅ Obligation account created successfully! Tx Signature: ${signature}`);
        return obligationAddress; // Return the newly created obligation address
    } catch (error) {
        console.error("❌ Error creating obligation account:", error);
        throw new Error("Failed to create or fetch Obligation Account");
    }
}


export const initObligationInstruction = (
    obligation: PublicKey,
    lendingMarket: PublicKey,
    obligationOwner: PublicKey,
    solendProgramAddress: PublicKey
  ): TransactionInstruction => {

    const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: 6 }, data);

  const keys = [
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: obligationOwner, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: solendProgramAddress,
    data,
  });

}