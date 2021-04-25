import { notify } from "./notification";
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
  notify({ message: "The Story coin address is copied to your clipboard!" });
}

function copyStoryCoinId(ev) {
  copyValue(ev.target);
  notify({ message: "The Story coin asset id is copied to your clipboard!" });
}

function fundStoryCoins(ev) {
  const { value } = ev.target;
  if (value.length === 58) {
    post("/fund", { recipient: value }).then(() => {
      ev.target.value = "";
      notify({ message: "You received 5 Story coins!" });
    });
  }
}

const story = document.getElementById("story");

function addNewStoryNotes() {
  get(`/notes?minRound=${window.lastRound}`).then(({ notes, lastRound }) => {
    if (notes.length) {
      notes.forEach(({ note, sender }) => {
        const noteSpan = document.createElement("span");
        noteSpan.innerText = note;
        noteSpan.dataset.sender = sender;
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
    senderNotes = story.querySelectorAll(`[data-sender=${sender}]`);
    senderNotes.forEach((note) =>
      Object.assign(note.style, { backgroundColor: "#ffea00", color: "#111" })
    );
  }
}

function onStoryHoverEnd() {
  senderNotes.forEach((note) =>
    Object.assign(note.style, { backgroundColor: null, color: null })
  );
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
document.getElementById("story").addEventListener("mouseout", onStoryHoverEnd);
