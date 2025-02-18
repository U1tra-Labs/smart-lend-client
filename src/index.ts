import { drfit_fetch_on_chain} from "./drift_fetch_on_chain";
import { marginfi_fetch_on_chain } from "./marginfi_fetch_on_chain";
import { kamino_fetch_on_chain } from "./kamino_fetch_on_chain";
import { save_fetch_on_chain } from "./save_fetch_on_chain";

async function main() {

    // Client to interact with the Drift V2
    //await drfit_fetch_on_chain();

    // Client to interact with the MarginFi
    //await marginfi_fetch_on_chain();

    // Client to interact with the Kamino
    //await kamino_fetch_on_chain();

    // Client to interact with the Solend
    await save_fetch_on_chain()


}


main();