require("dotenv").config({ path: "../.env" });
const algosdk = require("algosdk");
const { client } = require("../backend/client");

const treasury = algosdk.mnemonicToSecretKey(process.env.TREASURY_MNEMONIC);

async function createStoryCoin() {
  const params = await client.getTransactionParams().do();
  params.flatFee = true;
  params.fee = 1000;

  const addr = treasury.addr;
  const note = undefined;
  const defaultFrozen = false;
  const decimals = 0;
  const totalIssuance = 1000000;
  const unitName = "Story";
  const assetName = "Story";
  const assetURL = "https://bit.ly/3t1Eht8";
  const assetMetadataHash = undefined;

  const manager = treasury.addr;
  const reserve = treasury.addr;
  const freeze = treasury.addr;
  const clawback = treasury.addr;

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
    addr,
    note,
    totalIssuance,
    decimals,
    defaultFrozen,
    manager,
    reserve,
    freeze,
    clawback,
    unitName,
    assetName,
    assetURL,
    assetMetadataHash,
    params
  );

  const signedTxn = txn.signTxn(treasury.sk);
  await client.sendRawTransaction(signedTxn).do();
}

createStoryCoin().catch(console.error);
