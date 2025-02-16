import { AnchorProvider, BN, Program, Wallet, web3 } from "@project-serum/anchor";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { TransactionInstruction } from "@solana/web3.js";
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
    const connection = new Connection("https://purple-late-arm.solana-mainnet.quiknode.pro/1fb48d9023a3cdf3db2d4343938ac50a77166bdb", "confirmed");
    const wallet = new Wallet(keypair);
    let signer = wallet.publicKey;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new Program(idl, KAMINO_MAINNET, provider);

    
    let instructions = [];
    
    // Instruction: Create Address Lookup Table

    const recentSlot = await connection.getSlot("finalized");
    console.log("Recent Slot:", recentSlot);

    const [createLutIx, lookupTableAddressData] = AddressLookupTableProgram.createLookupTable({
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        recentSlot: recentSlot
    });

    lookupTableAddress = lookupTableAddressData;
    instructions.push(createLutIx);

    // Instruction: Init User Metadata

    [userMetadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_meta"), wallet.publicKey.toBuffer()],
        KAMINO_MAINNET
    );

    console.log("user Metada PDA: " , userMetadataPDA);

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

    instructions.push(IxInitUserMetadataAccount);

    // Instruction: InitObligation
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

      const IxInitObligation = await program.methods
        .initObligation(args) // Pass in the instruction arguments
        .accounts({
            obligationOwner: wallet.publicKey,
            feePayer: wallet.publicKey,
            obligation: obligationPDA,
            lendingMarket: lendingMarket,
            seed1Account: seed1Account,
            seed2Account: seed2Account,
            ownerUserMetadata: userMetadataPDA,
    
        })
        .instruction();

      instructions.push(IxInitObligation);

    // Instruction: initObligationFarmsForReserve
    const mode = 0;
    const farmsProgram = KAMINO_FARM_PROGRAM;
    
    [lendingMarketAuthorityPDA] = await web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("lma"), 
          lendingMarket.toBuffer(),
        ],
        program.programId
      );


      [userStatePDAofFARM] = await web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("user"), 
            KAMINO_RESERVE_FARM_STATE.toBuffer(),
            obligationPDA.toBuffer(),
        ],
        KAMINO_FARM_MAINNET
    )

    console.log("userStatePDAofFARM address: ", userStatePDAofFARM);

    const IxInitObligationFarmsForReserve = await program.methods
        .initObligationFarmsForReserve(mode)
        .accounts({
            payer: wallet.publicKey,
            owner: wallet.publicKey, // Obligation owner (same as before)
            obligation: obligationPDA,
            lendingMarketAuthority: lendingMarketAuthorityPDA,
            reserve: KAMINO_RESERVE_SOL, 
            reserveFarmState: KAMINO_RESERVE_FARM_STATE, // Derive if needed
            obligationFarm: userStatePDAofFARM, // Derive if needed
            lendingMarket: lendingMarket,
            farmsProgram: farmsProgram, 
        })
        .instruction();

    instructions.push(IxInitObligationFarmsForReserve);

    // Instruction: RefreshReserve
    const ixRefreshReserve = await program.methods.refreshReserve()
    .accounts({
        reserve: KAMINO_RESERVE_SOL,
        lendingMarket: lendingMarket,
        pythOracle: KAMINO_MAINNET,
        switchboardPriceOracle: KAMINO_MAINNET,
        switchboardTwapOracle: KAMINO_MAINNET,
        scopePrices: KAMINO_SCOPE_PRICES,
    })
    .instruction();
    instructions.push(ixRefreshReserve);

    // Instruction: RefreshObligation
    const txRefreshObligation = await program.methods.refreshObligation()
    .accounts({
        lendingMarket: lendingMarket,
        obligation: obligationPDA,
    }).instruction();

    instructions.push(txRefreshObligation);

    // Instruction: RefreshObligationFarmsForReserve
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
        }).instruction();

    instructions.push(txRefreshObligationFarmsForReserve);

    // Send the Tranasction: 
    const blockhashWithContext = await provider.connection.getLatestBlockhash();

    const Tx = new Transaction({
        feePayer: provider.wallet.publicKey,
        blockhash: blockhashWithContext.blockhash,
        lastValidBlockHeight: blockhashWithContext.lastValidBlockHeight,
    }).add(...instructions);

    const Signature = await sendAndConfirmTransaction(
        provider.connection,
        Tx,
        [wallet.payer],
        { skipPreflight: true}
    )

    console.log("Init Kamino Tx:", Signature);


   






}