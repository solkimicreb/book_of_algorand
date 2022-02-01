# The Book of Algorand

Cryptocurrencies provide an exciting new tool for us web developers which we should not ignore. Hidden behind the noise of mainstream media there is a world of constant innovation and constructive building.

Algorand was my entry to this world and it is still my favorite blockchain from a hobbyist and technological perspective. Being late to the party it has a lot less developed ecosystem but better foundation than Ethereum. It gives a chance to build things from the ground up and be recognized by a small community instead of copying and struggling in an ocean of other projects.

These are my favorite things about building with Algorand.

- It has an awesome [developer portal](https://developer.algorand.org/).
- It has simple primitives and guarantees which eases you into the learning slope.
- It has all the things you would expect from a modern chain - like NFTs, smart contracts and custom tokens.
- It has around 0.1 cent fees and 4.5 second block time. You can really go crazy with your ideas.
- Nodes can run on a Raspberry PI, you can easily set up your developer entry into the chain.
- It has a small ecosystem and community where you can engage and be recognized.

## A community-driven story on the Algorand blockchain

I wrote my first hobby blockchain project 9 months ago. The "Book of Algorand" is a simple crowd curated writing game where you can contribute sentences to a book by spending story coins. These coins can be obtained in a few ways:

- You can get them directly from a dispenser.
- Others can like your part of the story to send you a coin from the treasury.
- People can freely exchange coins among themselves outside of the game. It is a crypto**currency** after all.

![Story coin dispenser](/images/dispensed.png)

You can contribute to the story by sending at least 1 coin back to the treasury with a transaction note. These chronologically ordered transaction notes form the story.

![Story contribution](/images/send.jpg)

Feel free to [try the game](https://book-of-algorand.herokuapp.com/) before you continue reading.

## Creating the story coins

My first step was creating story coin, the main currency of the game. Custom tokens - called Algorand Standard Assets - require a simple http call to create instead of a smart contract.

### Connecting to an Algorand node

Developers can interact with the blockchain via nodes, which broadcast requests to the decentralized network. Running a node simple but for hobby purposes using a free third party one is sufficient. I recommend the [PureStake API](https://www.purestake.com/technology/algorand-api/).

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
```

- The `client` connects to a participation node, which may add valid transactions to the blockchain. We will use it to create and send story coins.
- The chain is the source of truth but it is hard to search. The `indexer` saves the blockchain into a searchable database which we can use to query and piece together the story.

### Creating the story treasury

Algorand produces keys with the Ed25519 elliptic-curve signature which takes a random value and outputs two 32-byte arrays, representing a public/private key pair. This key generation can be done completely offline and without the context of the blockchain. The public key becomes an account once it is added to the blockchain by funding it via a minimum of 0.1 Algo.

```js
const algosdk = require("algosdk");

const treasury = algosdk.generateAccount();
```

This can be done via any of the Algorand wallets - like the [My Algo Wallet](https://wallet.myalgo.com) or the [Official Wallet](https://algorandwallet.com/).

If you wish to learn more about Algorand account creation visit the [related documentation page](https://developer.algorand.org/docs/get-details/accounts/).

### Creating the story ASA

> Reminder: custom tokens are called Algorand Standard Assets (ASAs) in Algorand.

ASAs are created via an http requests with a few key parameters. The immutable parameters are:

- `totalIssuance`: the total number of mintable tokens, which is 1 for NFTs and a larger number for fungible tokens.
- `decimals`: the decimal points for the token, which is 0 for NFTs.
- `assetName`: The name of the token.
- `unitName`: The name of a single unit of the token.
- `assetUrl`: An url which points to the project's website.

Other important parameters can be changed after token creation.

- `reserve`: The Algorand address where the total supply of the ASA will be created. Tokens held by this address are regarded out of circulation.
- `freeze`: The Algorand address which can freeze token holdings of other accounts by a freeze transaction. This feature can be disabled by setting it to null.
- `clawback`: The Algorand address which can claw back holdings of other accounts by a clawback transaction. This feature can be disabled by setting it to null.
- `manager`: The Algorand address which can change the above fields of the ASA.

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

You can learn more about Algorand Standard Asset creation from the [related docs page](https://developer.algorand.org/docs/get-details/asa/).

## Writing the story

Users can contribute by sending a story coin transaction with a note back to the treasury. These transaction notes are retrieved and concatenated in a cronological order to form the current story.

The blockchain itself is not optimally searchable, it requires an indexer which feeds each block in real-time into an indexed database. Algorand provides a basic indexer which is sufficient for our simple task. We have to query all transactions which:

- sends coin ASAs.
- sends funds to the treasury address.
- sends at least one of the ASA.
- has a note.

```js
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
```

## Dispensing story coins

People can get free story coins and award existing writers from the treasury. Both of these are done with a simple transaction request which sends a story coin from the treasury to the given address.

```js
const algosdk = require("algosdk");
const { client, treasury } = require("./client");

async function sendStoryCoins() {
  const params = await client.getTransactionParams().do();
  params.flatFee = true;
  params.fee = 1000;

  const sender = treasury.addr;
  const closeRemainderTo = undefined;
  const revocationTarget = undefined;
  const amount = 1;
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
}
```

## Future plans

The current app works but it could use a lot of UX, rewards and incentivization improvements. The final goal is to bring the community together with the correct incentives through a cool UI and a seamless flow.

### WalletConnect

WalletConnect is a widely used standard which creates a bridge between a dapp and a wallet - potentially on another device. This bridge is then used to send unsigned transactions from the app to the wallet which signs the transaction and sends it back.

We could improve our UX by letting the users contribute to the story directly from the app. Users could write their contribution inside an input and sign and send it with a single click inside their mobile wallet.

[WalletConnect QR code](/images/qr.jpg)

### Incentives

One of the most difficult challenge in cryptocurrency are incentives. It is impossible to predict how people will use something as generic as a blockchain, especially when it is fully public and open source. Any of the following scenarious could happen.

- People purposefully ruin the story by writing inappropriate things.
- People start to use story coins as currency or store of value outside the app.
- A single user becomes a fan an ruins the game for everyone by hoarding story coins and limiting the supply.
- People figuring out a way to "farm" story coins with little effort which could ruin the game for others. Currently this is simply done by liking your own contributions a lot of times.
- I am sure I did not list everything here. People can exploit a project in extremely creative ways when they are anonymous over the internet and they can gain from it.

These can all be avoided by forming a carefully thought-out incentive system in advance. This task is perhaps more difficult than the pogramming one but it requires a similar mindset. A good programmer thinks about and covers all edge cases, the same attitude is required here. Only you can not patch things up in another release.

## Thank you for the attention

I am a 100% percent sure that my hobby project won't fulfill its vision and produce a coherent story yet but I had fun making it and I hope I peaked some soon-to-be-crypto-dev interest with it.
