# The Book of Algorand

Cryptocurrencies provide an exciting new tool for us web developers which we should not ignore. Hidden behind a lot of noise from mainstream media there is a world of constant innovation and constructive building.

Algorand was my entry to this world and it is still my favorite blockchain from a hobbyist and technological perspective. Being late to the party it has a lot less developed ecosystem but better foundation than Ethereum. You have a chance to build things from the ground up and be recognized by a small community instead of copying and struggling in an ocean of other projects.

Some of my favorite things about playing with Algorand:

- It has an awesome [developer portal](https://developer.algorand.org/).
- It has simple primitives and guarantees which eases you into the learning slope.
- It has all the things you would expect from a modern chain - like NFTs, smart contracts and custom tokens.
- It has around 0.1 cent fees and 4.5 second block time. You can really go crazy with your ideas.
- Nodes can run on a Raspberry PI, you can easily create your developer entry into the chain.
- It has a small ecosystem and community where you can engage and be recognized.
- It is not yet haunted by the mainstream crypto world.

This is my first Algorand project I wrote 9 months ago.

## A community-driven story on the Algorand blockchain

The Book of Algorand is a simple crowd curated story writing game. You can contribute sentences to a book by spending story coins, which can be obtained in a few ways:

- You can get them directly from a dispenser.
- Others can send you some from the dispenser by liking your part of the story.
- People can freely exchange them among themselves outside of the game. It is a crypto**currency** after all.

## Creating story coin

Custom tokens are called ASAs (Algorand Standard Assets) in Algorand. They are primitive building blocks and require a simple http call to create instead of a smart contract.

### Connecting to an Algorand node

You first have to connect to an Algorand node which broadcasts your request to the decentralized network. Running a node is simple but for hobby purposes using a free third party node is sufficient. I recommend the [PureStake API](https://www.purestake.com/technology/algorand-api/).

You can craft and send requests by hand to the node but the [JavaScript algosdk](https://github.com/algorand/js-algorand-sdk) makes things a bit simpler. The following code creates a light abstraction over the PureStake http api.

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
- The chain is the source of truth but it is hard to search. The `indexer` saves the blockchain into a searchable database to query data. We will use it to query and piece together the story from the chain.

```js
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
```

## Issues

One of the most difficult challenge in cryptocurrency are incentives. It is impossible to predict how people will use something as generic as a blockchain, especially when it is fully public and open source.

- People are flocking into centralized mining and staking pools becuase of financial incintives which were designed to promote decentralization.
- Others are selling jpegs instead of real "currencies".

> Incentives are the hardest thing to do.
> Silvio Micali, founder of Algorand

I am a 100% percent sure that my hobby project won't fulfill it's vision and produce a coherent story.

## The future
