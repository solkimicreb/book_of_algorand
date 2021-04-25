const { indexer, treasury } = require("./client");

const TRANSACTIONS_LIMIT = 10000;

async function getStoryNotes({ minRound } = {}) {
  let lastRound;
  let nextToken;
  const transactions = [];

  while (true) {
    const resp = await indexer
      .searchForTransactions()
      .address(treasury.addr)
      .txType("axfer")
      .currencyGreaterThan(0)
      .assetID(process.env.STORY_COIN_ID)
      .minRound(minRound)
      .nextToken(nextToken)
      .limit(TRANSACTIONS_LIMIT)
      .do();

    nextToken = resp["next-token"];
    lastRound = resp["current-round"];
    transactions.push(...resp.transactions);

    if (!resp.transactions.length < TRANSACTIONS_LIMIT) {
      break;
    }
  }

  const notes = transactions
    .sort((t1, t2) => (t1["round-time"] < t2["round-time"] ? -1 : 1))
    .filter(({ note }) => note)
    .map(({ note, sender }) => ({
      note: Buffer.from(note, "base64").toString("utf-8"),
      sender,
    }));

  return { notes, lastRound };
}

module.exports = {
  getStoryNotes,
};
