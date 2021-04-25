require("dotenv").config();
const express = require("express");
const { treasury } = require("./client");
const { getStoryNotes } = require("./getStoryNotes");
const { fundStoryCoins, isStoryCoinBlocked } = require("./fundStoryCoins");
const { wrap, handleError } = require("./errors");
const { frontendTemplate, frontendPath } = require("./template");

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.get(
  "/",
  wrap(async (req, res) => {
    const { notes, lastRound } = await getStoryNotes();

    res.send(
      frontendTemplate({
        notes,
        lastRound,
        treasuryAddress: treasury.addr,
        storyCoinId: process.env.STORY_COIN_ID,
      })
    );
  })
);

app.use(express.static(frontendPath));

app.get(
  "/notes",
  wrap(async (req, res) => {
    const resp = await getStoryNotes(req.query);
    res.send(resp);
  })
);

app.post(
  "/fund",
  wrap(async (req, res) => {
    const { recipient } = req.body;
    const blockReason = await isStoryCoinBlocked({ recipient });
    if (blockReason) {
      return res.status(400).send({ message: blockReason });
    }

    await fundStoryCoins({ recipient });
    res.send({ message: "You recieved 5 story coins" });
  })
);

app.use(handleError);

app.listen(port, () => console.log(`App listening at port: ${port}`));
