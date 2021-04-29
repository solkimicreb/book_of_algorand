const algosdk = require("algosdk");
const { client, treasury } = require("./client");

const fundNotes = [
  "Read something good recently?",
  "I know you have some good ideas!",
  "You can be a writer!",
  "Have any good ideas?",
  "Spend this at https://book-of-algorand.herokuapp.com!",
];

const getNote = (self) =>
  new TextEncoder().encode(
    self
      ? fundNotes[Math.round(Math.floor() * fundNotes.length)]
      : "Someone liked your writing!"
  );

async function fundStoryCoins({ recipient, self }) {
  const params = await client.getTransactionParams().do();
  params.flatFee = true;
  params.fee = 1000;

  const sender = treasury.addr;
  const closeRemainderTo = undefined;
  const revocationTarget = undefined;
  const amount = self ? 2 : 1;
  const encodedNote = getNote();
  const assetId = Number(process.env.STORY_COIN_ID);

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender,
    recipient,
    closeRemainderTo,
    revocationTarget,
    amount,
    encodedNote,
    assetId,
    params
  );

  const signedTxn = algosdk.signTransaction(txn, treasury.sk);
  await client.sendRawTransaction(signedTxn.blob).do();

  return {
    message: self
      ? "You recieved some Story coins!"
      : "We sent the author a Story coin on your behalf!",
  };
}

async function isStoryCoinBlocked({ recipient, self }) {
  const { assets } = await client.accountInformation(recipient).do();
  const storyCoins = assets.find(
    (asset) => asset["asset-id"] === Number(process.env.STORY_COIN_ID)
  );

  if (!storyCoins) {
    return self
      ? {
          message: `Please add the Story asset (id: ${process.env.STORY_COIN_ID}) to your wallet.`,
          addAsset: true,
        }
      : { message: "This author opted out of Story coins." };
  }
  if (storyCoins["is-frozen"]) {
    return {
      message: self
        ? "Your Story coin account is frozen."
        : "The author's Story coin account is frozen.",
    };
  }
  if (self && 2 <= storyCoins.amount) {
    return { message: "You already have some Story coins. Spend them first!" };
  }
  if (99 <= storyCoins.amount) {
    return {
      message:
        "This author is already loved by the community. Support the underdogs too!",
    };
  }
}

module.exports = {
  fundStoryCoins,
  isStoryCoinBlocked,
};
