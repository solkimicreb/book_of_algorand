const { client, treasury } = require("./client");

const fundNotes = ["I want to be a writer!", "Use me for your story!"];

const getRandomNote = () =>
  new TextEncoder().encode(
    fundNotes[Math.round(Math.floor() * fundNotes.length)]
  );

async function fundStoryCoins({ recipient }) {
  const params = await client.getTransactionParams().do();
  params.flatFee = true;
  params.fee = 1000;

  const sender = treasury.addr;
  const closeRemainderTo = undefined;
  const revocationTarget = undefined;
  const amount = Number(process.env.STORY_COIN_BATCH_SIZE);
  const note = getRandomNote();
  const assetId = Number(process.env.STORY_COIN_ID);

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender,
    recipient,
    closeRemainderTo,
    revocationTarget,
    amount,
    note,
    assetId,
    params
  );
  const signedTxn = algosdk.signTransaction(txn, treasury.sk);
  await client.sendRawTransaction(signedTxn.blob).do();
}

async function isStoryCoinBlocked({ recipient }) {
  const { assets } = await client.accountInformation(recipient).do();
  const storyCoin = assets.find(
    (asset) => asset["asset-id"] === Number(process.env.STORY_COIN_ID)
  );

  if (!storyCoin) {
    return `You have to add the "Story" asset (with id: ${process.env.STORY_COIN_ID}) to recieve id.`;
  }
  if (storyCoin["is-frozen"]) {
    return "Your Story coin account is frozen.";
  }
  if (10 < storyCoin.amount) {
    return "You can't request Story coins if you already have more than 10.";
  }
}

module.exports = {
  fundStoryCoins,
  isStoryCoinBlocked,
};
