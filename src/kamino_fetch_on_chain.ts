import { AnchorProvider, BN, Program, Wallet, web3 } from "@project-serum/anchor";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { AddressLookupTableAccount, AddressLookupTableProgram, clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import * as fs from "fs";


const IDL_PATH = "src/idl/kamino.json"; // Path to the IDL file
export const KAMINO_MAINNET = new PublicKey(
    "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"
);

export async function kamino_fetch_on_chain() {

    //Required Accounts
    let lookupTableAddress: PublicKey;
    let userMetadataPDA: PublicKey;





    // Initialize the program
    const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));
    const keypair = await getKeypairFromFile("/Users/chester/.config/solana/id.json");
    console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    //const connection = new Connection("https://purple-late-arm.solana-mainnet.quiknode.pro/1fb48d9023a3cdf3db2d4343938ac50a77166bdb", "confirmed");
    const wallet = new Wallet(keypair);
    let signer = wallet.publicKey;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new Program(idl, KAMINO_MAINNET, provider);

    // Step 1.  Create Lookup Table
    //const lookupTableAddress = createLookupTableAddress(connection, wallet);
    // this account has already been created and initialized on mainnet
    lookupTableAddress = new PublicKey("Ehq9mpV6n8G8okNnwd9ZDrr4DuoaqLtVaqn12YduQs6W");
    // Step 2. Kamino Lending Program: initUserMetadata

    [userMetadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_meta"), wallet.publicKey.toBuffer()],
        KAMINO_MAINNET
    );

    const IxInitUserMetadataAccount = await program.methods
        .initUserMetadata(lookupTableAddress)
        .accounts({
            owner: wallet.publicKey, // Owner & Fee Payer (Signer)
            feePayer: wallet.publicKey, // Fee Payer
            userMetadata: userMetadataPDA, // Writable user metadata account
            referrerUserMetadata: KAMINO_MAINNET, // No referrer in this case
            rent: SYSVAR_RENT_PUBKEY, // Rent sysvar
            systemProgram: SystemProgram.programId // System Program
        })
        .instruction();

        const blockhashWithContext = await provider.connection.getLatestBlockhash();

        const tx = new Transaction({
            feePayer: provider.wallet.publicKey,
            blockhash: blockhashWithContext.blockhash,
            lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
        }).add(IxInitUserMetadataAccount);


        const InitMetasignature = await sendAndConfirmTransaction(
            provider.connection,
            tx,
            [wallet.payer],
            { skipPreflight: true}
        )

        console.log("Init User Metadata Tx:", InitMetasignature);

        // Step2. InitObligation

        const IxInitObligation = await program.methods
        .InitObligation()
        .accounts({
            owner: wallet.publicKey, // Owner & Fee Payer (Signer)
            feePayer: wallet.publicKey, // Fee Payer
            userMetadata: userMetadataPDA, // Writable user metadata account
            referrerUserMetadata: KAMINO_MAINNET, // No referrer in this case
            rent: SYSVAR_RENT_PUBKEY, // Rent sysvar
            systemProgram: SystemProgram.programId // System Program
        })
        .instruction();



}



async function createLookupTableAddress(connection: Connection, wallet: Wallet) {

    const recentSlot = await connection.getSlot("finalized");
    console.log("Recent Slot:", recentSlot);

    const [createLutIx, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        recentSlot: recentSlot
    });

    console.log("Lookup Table Address:", lookupTableAddress.toBase58());

    const transaction = new Transaction().add(createLutIx);
    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer]);

    console.log(`✅ ALT Created Successfully! Tx: ${signature}`);
    console.log(`🔗 Lookup Table Address: ${lookupTableAddress.toBase58()}`);


}
