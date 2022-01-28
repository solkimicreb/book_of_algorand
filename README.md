# The Book of Algorand

Cryptocurrencies provide an exciting new tool for us web developers which we should not ignore. Hidden behind a lot of noise from mainstream media there is a world of constant innovation and constructive building.

Algorand was my entry to this world and it is still my favorite blockchain from a hobbyist and technological perspective. Being late to the party it has a lot less developed ecosystem but better foundation than Ethereum. It gives a chance to build things from the ground up and be recognized by a small community instead of copying and struggling in an ocean of other projects.

These are my favorite things about building with Algorand.

- It has an awesome [developer portal](https://developer.algorand.org/).
- It has simple primitives and guarantees which eases you into the learning slope.
- It has all the things you would expect from a modern chain - like NFTs, smart contracts and custom tokens.
- It has around 0.1 cent fees and 4.5 second block time. You can really go crazy with your ideas.
- Nodes can run on a Raspberry PI, you can easily create your developer entry into the chain.
- It has a small ecosystem and community where you can engage and be recognized.
- It is not yet haunted by the mainstream crypto world.

## A community-driven story on the Algorand blockchain

I wrote my first blockchain hobby project 9 months ago. The "Book of Algorand" is a simple crowd curated writing game. You can contribute sentences to a book by spending story coins, which can be obtained in a few ways:

- You can get them directly from a dispenser.
- Others can send you some from the dispenser by liking your part of the story.
- People can freely exchange them among themselves outside of the game. It is a crypto**currency** after all.

Feel free to [try the game](https://book-of-algorand.herokuapp.com/) before you continue.

## Creating story coin

My first step was creating story coin - the main currency of the game. Custom tokens are called Algorand Standard Assets - ASAs - in Algorand. They are primitive building blocks and require a simple http call to create instead of a smart contract.

### Connecting to an Algorand node

Developers can interact with the blockchain via nodes, which broadcast requests to the decentralized network. Running them is simple but for hobby purposes using a free third party node is sufficient. I recommend the [PureStake API](https://www.purestake.com/technology/algorand-api/).

The [JavaScript algosdk](https://github.com/algorand/js-algorand-sdk) provides a light abstraction over a node's http interface to simplify the transaction creation and sending process. The following code creates a connection to the Algorand node hosted by PureStake.

```js
const algosdk = require("algosdk");

const apiServer = process.env.API_HOST;
const apiPort = process.env.API_PORT;
const indexerServer = process.env.INDEXER_HOST;
const indexerPort = process.env.INDEXER_PORT;
const token = {
  "X-API-Key": process.env.API_KEY,
};

const client = new algosdk.Algodv2(token, apiServer, apiPort);
const indexer = new algosdk.Indexer(token, indexerServer, indexerPort);

const treasury = algosdk.mnemonicToSecretKey(process.env.TREASURY_MNEMONIC);

module.exports = {
  client,
  indexer,
  treasury,
};
```

- The `client` connects to a participation node, which may add valid transactions to the blockchain. We will use this to add our ASA.
- The chain is the only source of truth but it is hard to search. The `indexer` saves the blockchain into a searchable database to query data. We will use it to query and piece together the story from the chain.

### Creating the story treasury

Algorand produces keys with the Ed25519 elliptic-curve signature which takes a random value and outputs two 32-byte arrays, representing a public/private key pair. This key generation can be done completely offline and without the context of the blockchain. The public key becomes an account once it is added to the blockchain by funding it via a minimum of 0.1 Algo.

```js
const algosdk = require("algosdk");

const treasury = algosdk.generateAccount();
```

This can be done via any of the Algorand wallets - like the [My Algo Wallet]() or the [Official Wallet]().

If you wish to learn more about Algorand account creation visit the [related documentation page](https://developer.algorand.org/docs/get-details/accounts/).

### Creating the story ASA

Once

```js
const algosdk = require("algosdk");
const { client } = require("./client");
const treasury = require("./treasury");

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
```

## Writing the story

Users can contribute by sending a story coin transaction with a note back to the treasury. These transaction notes are retrieved and concatenated in a cronological order to form the current story.

The blockchain itself is not optimally searchable, it requires an indexer which feeds each block in real-time into an indexed database. Algorand provides a basic indexer which is sufficient for our simple task. We have to query all transactions which:

- sends funds to the treasury address.
- sends coin ASAs.
- sends at least on of the ASA.
- has a note.

```js
const { indexer, treasury } = require("./client");

async function getStoryNotes({ minRound } = {}) {
  let lastRound;
  let nextToken;
  const transactions = [];

  while (true) {
    const resp = await indexer
      .searchForTransactions()
      .address(treasury.addr)
      .minRound(minRound)
      .nextToken(nextToken)
      .limit(100000)
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
```

## Dispensing story coins

add all methods

## Issues

One of the most difficult challenge in cryptocurrency are incentives. It is impossible to predict how people will use something as generic as a blockchain, especially when it is fully public and open source.

- People are flocking into centralized mining and staking pools becuase of financial incintives which were designed to promote decentralization.
- Others are selling jpegs instead of real "currencies".

> Incentives are the hardest thing to do.
> Silvio Micali, founder of Algorand

I am a 100% percent sure that my hobby project won't fulfill it's vision and produce a coherent story.

## The future
