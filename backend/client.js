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
