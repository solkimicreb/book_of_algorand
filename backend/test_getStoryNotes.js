require("dotenv").config();
const { indexer, treasury } = require("./client");

async function getStoryNotes() {
  const { transactions } = await indexer
    .lookupAssetTransactions(process.env.STORY_COIN_ID)
    .address(treasury.addr)
    .addressRole("receiver")
    .currencyGreaterThan(0)
    .do();

  return transactions
    .sort((t1, t2) => (t1["round-time"] < t2["round-time"] ? -1 : 1))
    .filter(({ note }) => note)
    .map((transaction) => ({
      note: Buffer.from(transaction.note, "base64").toString("utf-8").trim(),
      sender: transaction.sender,
      type: transaction["tx-type"],
      amount: transaction["asset-transfer-transaction"].amount,
    }));
}

getStoryNotes().then((notes) =>
  console.log(
    "NOTES",
    notes.map((note) => note.note)
  )
);
