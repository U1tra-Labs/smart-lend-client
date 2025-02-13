import { AnchorProvider, BN, Program, Wallet, web3 } from "@project-serum/anchor";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { AddressLookupTableAccount, AddressLookupTableProgram, clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import * as fs from "fs";


const IDL_PATH = "src/idl/kamino.json"; // Path to the IDL file
const KAMINO_MAINNET = new PublicKey(
    "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"
);

const KAMINO_FARM_MAINNET = new PublicKey(
    "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr");

const KAMINO_LENDING_JITO_MARKET = new PublicKey(
    "H6rHXmXoCQvq8Ue81MqNh7ow5ysPa1dSozwW3PU1dDH6");

const KAMINO_FARM_PROGRAM = new PublicKey(
    "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr");

const KAMINO_RESERVE_SOL =  new PublicKey(
    "6gTJfuPHEg6uRAijRkMqNc9kan4sVZejKMxmvx2grT1p"
);

const KAMINO_RESERVE_FARM_STATE = new PublicKey(
    "BgMEUzcjkJxEH1PdPkZyv3NbUynwbkPiNJ7X2x7G1JmH");

const KAMINO_SCOPE_PRICES = new PublicKey(
    "3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C");


const seed1Account = SystemProgram.programId;
const seed2Account = SystemProgram.programId;

export async function kamino_fetch_on_chain() {

    //Required Accounts
    let lookupTableAddress: PublicKey;
    let userMetadataPDA: PublicKey;
    let obligationPDA: PublicKey;
    let lendingMarketAuthorityPDA: PublicKey;
    let userStatePDAofFARM: PublicKey;


    // Initialize the program
    const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));
    const keypair = await getKeypairFromFile("/Users/chester/.config/solana/id.json");
    console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
    //const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    const connection = new Connection("https://purple-late-arm.solana-mainnet.quiknode.pro/1fb48d9023a3cdf3db2d4343938ac50a77166bdb", "confirmed");
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

    console.log("user Metada PDA: " , userMetadataPDA);

    // const IxInitUserMetadataAccount = await program.methods
    //     .initUserMetadata(lookupTableAddress)
    //     .accounts({
    //         owner: wallet.publicKey, // Owner & Fee Payer (Signer)
    //         feePayer: wallet.publicKey, // Fee Payer
    //         userMetadata: userMetadataPDA, // Writable user metadata account
    //         referrerUserMetadata: KAMINO_MAINNET, // No referrer in this case
    //         rent: SYSVAR_RENT_PUBKEY, // Rent sysvar
    //         systemProgram: SystemProgram.programId // System Program
    //     })
    //     .instruction();

    //     const blockhashWithContext = await provider.connection.getLatestBlockhash();

    //     const tx = new Transaction({
    //         feePayer: provider.wallet.publicKey,
    //         blockhash: blockhashWithContext.blockhash,
    //         lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    //     }).add(IxInitUserMetadataAccount);


    //     const InitMetasignature = await sendAndConfirmTransaction(
    //         provider.connection,
    //         tx,
    //         [wallet.payer],
    //         { skipPreflight: true}
    //     )

    //     console.log("Init User Metadata Tx:", InitMetasignature);

        // Step2. InitObligation

        console.log("InitObligation");

        interface InitObligationArgs {
            tag: number; // u8 in Rust -> number in TS (0-255)
            id: number;  // u8 in Rust -> number in TS (0-255)
          }

        const args: InitObligationArgs = {
            tag: 0, 
            id: 0,  
          };

        const lendingMarket = KAMINO_LENDING_JITO_MARKET;

        [obligationPDA] = await web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from(Uint8Array.of(args.tag)),
              Buffer.from(Uint8Array.of(args.id)),
              wallet.publicKey.toBuffer(),
              lendingMarket.toBuffer(),
              seed1Account.toBuffer(),
              seed2Account.toBuffer(),
            ],
            program.programId
          );

          console.log("Obligation PDA address: ", obligationPDA);

        //   const IxInitObligation = await program.methods
        //   .initObligation(args) // Pass in the instruction arguments
        //   .accounts({
        //     obligationOwner: wallet.publicKey,
        //     feePayer: wallet.publicKey,
        //     obligation: obligationPDA,
        //     lendingMarket: lendingMarket,
        //     seed1Account: seed1Account,
        //     seed2Account: seed2Account,
        //     ownerUserMetadata: userMetadataPDA,
     
        //   })
        //   .instruction();

        // const blockhashWithContext = await provider.connection.getLatestBlockhash();

        // const txInitObligation = new Transaction({
        //     feePayer: provider.wallet.publicKey,
        //     blockhash: blockhashWithContext.blockhash,
        //     lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
        // }).add(IxInitObligation);


        // const InitObligationSignature = await sendAndConfirmTransaction(
        //     provider.connection,
        //     txInitObligation,
        //     [wallet.payer],
        //     { skipPreflight: true}
        // )

        // console.log("Init User Obligation Tx:", InitObligationSignature);

        // Step 3.  initObligationFarmsForReserve

        console.log("initObligationFarmsForReserve");

        const mode = 0;
        const farmsProgram = KAMINO_FARM_PROGRAM;
        const obligationFarmKeypair = web3.Keypair.generate();

        [lendingMarketAuthorityPDA] = await web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from("lma"), 
              lendingMarket.toBuffer(),
            ],
            program.programId
          );

        //        seeds = [BASE_SEED_USER_STATE, farm_state.key().as_ref(), delegatee.key().as_ref()],

        [userStatePDAofFARM] = await web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("user"), 
                KAMINO_RESERVE_FARM_STATE.toBuffer(),
                obligationPDA.toBuffer(),
            ],
            KAMINO_FARM_MAINNET
        )

        console.log("userStatePDAofFARM address: ", userStatePDAofFARM);

        // const IxInitObligationFarmsForReserve = await program.methods
        //     .initObligationFarmsForReserve(mode)
        //     .accounts({
        //         payer: wallet.publicKey,
        //         owner: wallet.publicKey, // Obligation owner (same as before)
        //         obligation: obligationPDA,
        //         lendingMarketAuthority: lendingMarketAuthorityPDA,
        //         reserve: KAMINO_RESERVE_SOL, 
        //         reserveFarmState: KAMINO_RESERVE_FARM_STATE, // Derive if needed
        //         obligationFarm: userStatePDAofFARM, // Derive if needed
        //         lendingMarket: lendingMarket,
        //         farmsProgram: farmsProgram, 
        //     })
        //     .instruction();

        // const blockhashWithContext = await provider.connection.getLatestBlockhash();

        // const TxInitObligationFarmsForReserve = new Transaction({
        //         feePayer: provider.wallet.publicKey,
        //         blockhash: blockhashWithContext.blockhash,
        //         lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
        // }).add(IxInitObligationFarmsForReserve);


        // const InitFarmReserveSignature = await sendAndConfirmTransaction(
        //         provider.connection,
        //         TxInitObligationFarmsForReserve,
        //         [wallet.payer],
        //         { skipPreflight: true}
        // )

        // console.log("Init Farm Reserve Tx:", InitFarmReserveSignature);


        //Step 4. RefreshReserve
        const ix = await program.methods.refreshReserve()
            .accounts({
                reserve: KAMINO_RESERVE_SOL,
                lendingMarket: lendingMarket,
                pythOracle: KAMINO_MAINNET,
                switchboardPriceOracle: KAMINO_MAINNET,
                switchboardTwapOracle: KAMINO_MAINNET,
                scopePrices: KAMINO_SCOPE_PRICES,
            })
            .rpc();

        console.log("Refresh Reserve: ", ix);

        //Step 5. RefreshObligation
        const txRefreshObligation = await program.methods.refreshObligation()
            .accounts({
                lendingMarket: lendingMarket,
                obligation: obligationPDA,
            }).rpc();

        console.log("Refresh Obligation: ", txRefreshObligation);

        //Steo 6. RefreshObligationFarmsForReserve

        
        const txRefreshObligationFarmsForReserve = await program.methods
            .refreshObligationFarmsForReserve(mode)
            .accounts({
                crank: wallet.publicKey,
                obligation: obligationPDA,
                lendingMarketAuthority: lendingMarketAuthorityPDA,
                reserve: KAMINO_RESERVE_SOL,
                reserveFarmState: KAMINO_RESERVE_FARM_STATE,
                obligationFarmUserState: userStatePDAofFARM,
                lendingMarket: lendingMarket,
                farmsProgram: KAMINO_FARM_MAINNET,
            }).rpc();

        console.log("Refresh Obligation Farm For Reserve: ", txRefreshObligationFarmsForReserve);


        // After work - Close Accounts the reclaim the funds
        

    



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
