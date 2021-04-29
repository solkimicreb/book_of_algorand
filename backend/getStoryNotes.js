const { indexer, treasury } = require("./client");

const transactionLimit = 10000;

let lastRefresh = Date.now();
let cache = {
  notes: [],
  lastRound: 0,
};

async function getStoryNotes(params) {
  try {
    const timeSinceLastRefresh = Date.now() - lastRefresh;

    if (
      !cache ||
      Number(process.env.POLL_INTERVAL) * 10 < timeSinceLastRefresh
    ) {
      cache = await _getStoryNotes(params);
      lastRefresh = Date.now();
    }
  } catch (err) {
    console.error(err, err.stack);
  } finally {
    return cache;
  }
}

async function _getStoryNotes({ minRound } = {}) {
  let lastRound;
  let nextToken;
  const transactions = [];

  while (true) {
    const resp = await indexer
      .searchForTransactions()
      .address(treasury.addr)
      .minRound(minRound)
      .nextToken(nextToken)
      .limit(transactionLimit)
      .do();

    nextToken = resp["next-token"];
    lastRound = resp["current-round"];

    const validTransactions = resp.transactions.filter((transaction) => {
      const type = transaction["tx-type"];
      if (type === "axfer") {
        return (
          transaction["asset-transfer-transaction"].receiver === treasury.addr
        );
      }
      if (type === "pay") {
        const { amount, receiver } = transaction["payment-transaction"];
        return receiver === treasury.addr && 1000000 <= amount;
      }
      return false;
    });

    transactions.push(...validTransactions);

    if (resp.transactions.length < transactionLimit) {
      break;
    }
  }

  const notes = transactions
    .sort((t1, t2) => (t1["round-time"] < t2["round-time"] ? -1 : 1))
    .filter(({ note }) => note)
    .map((transaction) => ({
      note: Buffer.from(transaction.note, "base64").toString("utf-8").trim(),
      sender: transaction.sender,
      type: transaction["tx-type"],
      amount:
        transaction["tx-type"] === "axfer"
          ? transaction["asset-transfer-transaction"].amount
          : transaction["payment-transaction"].amount / 1000000,
    }));

  return { notes, lastRound };
}

module.exports = {
  getStoryNotes,
};
