import { notify, closeNotification } from "./notification";
import { post, get } from "./api";

function copyValue(target) {
  const range = document.createRange();
  range.selectNode(target);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
}

function copyTreasuryAddress(ev) {
  copyValue(ev.target);
  notify({
    message: "The Story coin address is copied to your clipboard!",
    color: "success",
  });
}

function copyStoryCoinId(ev) {
  copyValue(ev.target);
  notify({
    message: "The Story coin asset id is copied to your clipboard!",
    color: "success",
  });
}

function fundStoryCoins(ev) {
  const { value } = ev.target;
  if (value.length === 58) {
    post("/fund", { recipient: value }).then(({ message }) =>
      notify({ message, color: "success" })
    );
  }
}

const story = document.getElementById("story");
const info = document.getElementById("info");

function addNewStoryNotes() {
  get(`/notes?minRound=${window.lastRound}`).then(({ notes, lastRound }) => {
    if (notes.length) {
      notes.forEach(({ note, sender, amount, type }) => {
        const noteSpan = document.createElement("span");
        noteSpan.innerText = note;
        Object.assign(noteSpan.dataset, { sender, amount, type });
        story.appendChild(noteSpan);
      });
    }
    window.lastRound = lastRound;
  });
}

setInterval(addNewStoryNotes, Number(process.env.POLL_INTERVAL) * 1000);

let senderNotes = [];

function onStoryHoverStart(ev) {
  if (ev.target !== story) {
    const { sender } = ev.target.dataset;
    senderNotes = [...story.querySelectorAll(`[data-sender=${sender}]`)];
    senderNotes.forEach((note) => (note.className = "gold"));

    const algoNotes = senderNotes.filter((note) => note.dataset.type === "pay");
    const coinNotes = senderNotes.filter(
      (note) => note.dataset.type === "axfer"
    );
    const algosSpent = algoNotes.reduce(
      (algos, note) => algos + Number(note.dataset.amount),
      0
    );
    const coinsSpent = coinNotes.reduce(
      (coins, note) => coins + Number(note.dataset.amount),
      0
    );
    const spentText = [
      coinsSpent && `${coinsSpent} Story coins`,
      algosSpent && `${algosSpent} Algos`,
    ]
      .filter(Boolean)
      .join(" and ");

    const message = `This author contributed ${senderNotes.length} times with ${spentText}.`;
    notify({ message, timeout: false });
  }
}

function onStoryHoverEnd(ev) {
  senderNotes.forEach((note) => (note.className = ""));
  closeNotification();
}

document
  .getElementById("address")
  .addEventListener("click", copyTreasuryAddress);
document
  .getElementById("story-coin-id")
  .addEventListener("click", copyStoryCoinId);
document
  .getElementById("story-input")
  .addEventListener("input", fundStoryCoins);

document
  .getElementById("story")
  .addEventListener("mouseover", onStoryHoverStart);
document
  .getElementById("story")
  .addEventListener("mouseleave", onStoryHoverEnd);
