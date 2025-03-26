/**
 * Guide: How to Run This Script
 * --------------------------------
 * 1️⃣ Ensure you are in the correct project directory:
 *    cd path/to/lend-ts-client
 * 
 * 2️⃣ Install dependencies (if not already installed):
 *    npm install
 * 
 * 3️⃣ Run the script using:
 *    npx start
 * 
 * 4️⃣ Modify the script to uncomment the function calls 
 *    for the protocols you want to interact with.
 * 
 * 5️⃣ Ensure your Solana wallet is correctly set up:
 *    solana config get
 *    solana config set --keypair /Users/chester/.config/solana/id.json
 * 
 * --------------------------------
 * This script fetches on-chain data from various lending protocols:
 * - Drift V2
 * - MarginFi
 * - Kamino
 * - Solend (via save_fetch_on_chain)
 */

import { drfit_fetch_on_chain} from "./drift_fetch_on_chain";
import { marginfi_fetch_on_chain } from "./marginfi_fetch_on_chain";
import { kamino_fetch_on_chain } from "./kamino_fetch_on_chain";
import { save_fetch_on_chain } from "./save_fetch_on_chain";

async function main() {

    // Client to interact with the Drift V2
    await drfit_fetch_on_chain();

    // Client to interact with the MarginFi
    //await marginfi_fetch_on_chain();

    // Client to interact with the Kamino
    //await kamino_fetch_on_chain();

    // Client to interact with the Solend
    // await save_fetch_on_chain()


}


main();