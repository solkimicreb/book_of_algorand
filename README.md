## Keywords (TODO: delete this section)

Igyekeztem oket a cikk elejen belevenni. Nem tudom szamit-e.

- algo news (1x-szer benne)
- algo wallet (2x-szer benne)
- how to mine algorand (nincs ertelme sajna)
- algo token (az algo coin, nem token; algo coin 2x-szer benne van)
- algorand token (algo coinkent 2x-szer benne, lasd feljebb)
- algorand cryptocurrency (1x-szer benne)
- what is algorand
- auto lenders go (ez nem tudom mi sajna)
- algorand proof of stake (Pure Proof of Stake-kent 1x-szer benne)
- how many algorand coins are there (ezt nem tudom belerakni)
- algorand network (1x-szer benne)
- algorand explained

# How does Algorand work? Creating the Book of Algorand.

Cryptocurrencies provide an exciting new tool for us web developers which we should not ignore. Hidden behind the noise of mainstream media there is a world of constant innovation and constructive building.

The Algorand cryptocurrency was my entry to this world and it is still my favorite blockchain from a hobbyist and technological perspective. Being late to the party it has a lot less developed ecosystem but better foundation than Ethereum. It gives a chance to build things from the ground up and be recognized by a small community instead of copying and struggling in an ocean of other projects.

My favorite things about building with Algorand network are:

- the awesome [developer portal](https://developer.algorand.org/).
- the simple primitives and guarantees which eases you into the learning slope.
- all the things you would expect from a modern chain - like NFTs, smart contracts and custom tokens.
- the 0.1 cent fees and 4.5 second block time. You can really go crazy with your ideas thank to the Pure Proof of Stake model.
- the small ecosystem and community where you can engage and be recognized.

## A community-driven story on the Algorand blockchain

I wrote my first hobby blockchain project 9 months ago. The "Book of Algorand" is a simple crowd curated writing game where you can contribute sentences to a book by spending story coins. These coins can be obtained in a few ways:

- You can get them directly from a dispenser.
- Others can like your part of the story to send you a coin from the treasury.
- You can freely exchange coins with others outside of the game. It is a crypto**currency** after all.

![Story coin dispenser](/images/dispensed.png)

You can contribute to the story by sending at least 1 coin back to the treasury with a transaction note. These chronologically ordered transaction notes form the story.

![Story contribution](/images/send.jpg)

Feel free to [try the game](https://book-of-algorand.herokuapp.com/) before you continue reading.

## Creating the story coins

My first step was creating story coin, the main currency of the game. Custom tokens - called Algorand Standard Assets - require a simple http call to create instead of a smart contract.

### Connecting to an Algorand node

Developers can interact with the blockchain via nodes, which broadcast requests to the decentralized network. Running a node is simple but for hobby purposes using a free third party one is sufficient. I recommend the [PureStake API](https://www.purestake.com/technology/algorand-api/).

The [JavaScript algosdk](https://github.com/algorand/js-algorand-sdk) provides a light abstraction over a node's http interface and provides necessary cryptographic primitives to interact with the blockchain. The following code creates a connection to the Algorand node hosted by PureStake.

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
- The chain is the source of truth but it is hard to search. The `indexer` saves the blockchain into a searchable database which we can use to piece the story together.

### Creating the story treasury

Algorand produces keys with the Ed25519 elliptic-curve signature which takes a random value and outputs two 32-byte arrays, representing a public/private key pair. This key discovery can be done completely offline and without the context of the blockchain.

```js
const algosdk = require("algosdk");

const treasury = algosdk.generateAccount();
```

This should be used as a one-off script to discover and securely store a key pair for the story coin treasury. Although storing private keys is a sensitive topic, for the purpose of this hobby project I simply transformed it into a 25 word mnemonic and stored it as an environmental variable. The below snippet transforms between a mnemonic and key pair form for our application.

```js
const algosdk = require("algosdk");

const secretKey = algosdk.mnemonicToSecretKey(process.env.TREASURY_MNEMONIC);
const mnemonic = algosdk.secretKeyToMnemonic(treasury.sk);
```

A public key represents an Algorand account once it is added to the blockchain via a minimum 0.1 algo coin funding transaction. Algo - the base currency of Algorand blockchain - secures the network against DOS and spam attacks. The 0.1 algo coin minimum balance is required to prevent account creation spams.

```js
const algosdk = require("algosdk");
const { client } = require("./client");
const treasury = require("./treasury");

async function fundStoryTreasury() {
  const params = await client.getTransactionParams().do();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: "another account address with spare algos",
    to: treasury.addr,
    // 300000 microalgos === 0.3 algos
    amount: 300000,
    note: null,
    suggestedParams: params,
  });

  const signedTxn = txn.signTxn("secret key of sender address");
  await client.sendRawTransaction(signedTxn).do();
}
```

This scripts creates and funds the treasury account by 0.3 algos to cover the cost of the account creation and later transaction fees.

If you wish to learn more about Algorand accounts visit the [related documentation page](https://developer.algorand.org/docs/get-details/accounts/).

### Creating the story ASA

> Reminder: custom tokens are called Algorand Standard Assets (ASAs).

ASAs are created via an http requests with a few immutable parameters.

- `totalIssuance`: the total number of mintable tokens which is 1 for NFTs and a larger number for fungible tokens.
- `decimals`: the decimal points for the token which is 0 for NFTs.
- `assetName`: The name of the token.
- `unitName`: The name of a single unit of the token.
- `assetUrl`: An url which points to the project's website.

Other important parameters can be changed after token creation.

- `reserve`: The Algorand address where the total supply of the ASA will be created. Tokens held by this address are regarded as out of circulation.
- `freeze`: The Algorand address which can freeze token holdings of other accounts by a freeze transaction. This feature can be disabled by setting it to null.
- `clawback`: The Algorand address which can claw back holdings of other accounts by a clawback transaction. This feature can be disabled by setting it to null.
- `manager`: The Algorand address which can change the above fields of the ASA.

```js
const algosdk = require("algosdk");
const { client } = require("./client");
const treasury = require("./treasury");

async function createStoryCoin() {
  const params = await client.getTransactionParams().do();

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

This script creates a million story coins into the treasury account. These coins are considered out of circulation until they leave the treasury address via a transaction.

You can learn more about Algorand Standard Asset creation from the [related docs page](https://developer.algorand.org/docs/get-details/asa/).

## Dispensing story coins

People can get free story coins and award existing writers from the treasury. Both of these are done with a simple asset transfer transaction which sends a story coin from the treasury to the given address.

```js
const algosdk = require("algosdk");
const { client, treasury } = require("./client");

async function sendStoryCoins() {
  const params = await client.getTransactionParams().do();

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

## Writing the story

Users can contribute to the story by sending a story coin transaction with a note back to the treasury. These transaction notes are retrieved and concatenated in a cronological order to form the current story.

The blockchain itself is not optimally searchable, it requires an indexer which feeds each block into a database. Algorand provides a basic indexer which is sufficient for our simple task. We have to query for transactions which:

- send coin ASAs.
- send funds to the treasury address.
- send at least one of the ASA.
- have a note.

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

The chronologically ordered notes of these transactions form our story.

## Future plans

The app works but it could use a lot of UX, rewards and incentivization improvements. The final goal is to bring the community together with the correct incentives through a cool UI and a seamless flow.

### WalletConnect

WalletConnect is a widely used standard which creates a bridge between a dapp and a wallet - potentially on another device. This bridge is then used to send unsigned transactions from the app to the wallet which signs the transaction and sends it back.

We could improve our UX by letting the users contribute to the story directly from the app. Users could write their contribution inside an input and sign and send it with a single click inside their mobile algo wallet.

![WalletConnect QR code](/images/qr.png)
Dapp - algo wallet sessions can be created via QR codes.

![Transaction sign](/images/transaction.jpg)
Wallet devices can sign transactions from other bridged devices via a simple click while the session is alive.

### Incentives

One of the most difficult challenge in cryptocurrency are incentives. It is impossible to predict how people will use something as generic as a blockchain, especially when it is fully public and open source. Any of the following scenarious could happen.

- People purposefully ruin the story by writing inappropriate things.
- People start to use story coins as currency or store of value outside the app.
- A single user becomes a fan an ruins the game for everyone by hoarding story coins and limiting the supply.
- People figuring out a way to "farm" story coins with little effort which could ruin the game for others. Currently this is simply done by liking your own contributions a lot of times.
- I am sure I did not list everything here. People can exploit a project in extremely creative ways under the safety of anonymity.

These can all be avoided by forming a carefully thought-out incentive system in advance. This task is perhaps more difficult than the programming one but it requires a similar mindset. A good programmer thinks about and covers all edge cases.

In this case hindsight and patches are a lot more difficult to do though. Updating a production dapp requires the approval and joint work of the userbase which is a huge burden and a beautiful concept at once.

## Thank you for the attention

I am a 100% percent sure that my hobby project won't fulfill its vision and produce a coherent story yet but I had fun making it and I hope I peaked some interest with it. You can follow the latest algo news and development updates on [their site](https://developer.algorand.org/).
