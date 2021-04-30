import { notify } from "./notification";
import { post, get } from "./api";

let senderNotes = [];
const supportedAuthors = [];

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
    message: "The Story address is copied to your clipboard!",
    color: "success",
  });
}

function copyStoryCoinId(ev) {
  copyValue(ev.target);
  notify({
    message: "The Story asset id is copied to your clipboard!",
    color: "success",
  });
}

function fundStoryCoins(ev) {
  const { value } = ev.target;
  if (value.length === 58) {
    const timeout = 4000;
    post("/fund", { recipient: value, self: true })
      .then(({ message }) => notify({ message, color: "success", timeout }))
      .catch((err) => {
        if (err.addAsset) {
          const addAsset = document.getElementById("story-coin-id");
          addAsset.classList.add("danger");
          setTimeout(() => addAsset.classList.remove("danger"), timeout);
        }
        ev.target.value = "";
      });
  }
}

function supportStoryCoins() {
  const firstNote = senderNotes[0];
  if (firstNote) {
    const recipient = firstNote.dataset.sender;
    if (supportedAuthors.indexOf(recipient) !== -1) {
      return notify({
        message: "That's enough support for a single author!",
        color: "danger",
      });
    }
    post("/fund", { recipient }).then(({ message }) => {
      supportedAuthors.push(recipient);
      notify({ message, color: "success" });
    });
  }
}

const story = document.getElementById("story");
const bottomBar = document.getElementById("bottom-bar");

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

function pollStoryNotes() {
  if (!document.hidden) {
    addNewStoryNotes();
  }
}

setInterval(pollStoryNotes, Number(process.env.POLL_INTERVAL) * 1000);

function highlightStoryParts(author) {
  senderNotes = [...story.querySelectorAll(`[data-sender=${author}]`)];
  senderNotes.forEach((note) => note.classList.add("selected"));

  const algoNotes = senderNotes.filter((note) => note.dataset.type === "pay");
  const coinNotes = senderNotes.filter((note) => note.dataset.type === "axfer");
  const algosSpent = algoNotes.reduce(
    (algos, note) => algos + Number(note.dataset.amount),
    0
  );
  const coinsSpent = coinNotes.reduce(
    (coins, note) => coins + Number(note.dataset.amount),
    0
  );
  const spentText = [
    pluralize(coinsSpent, "Story coin"),
    pluralize(algosSpent, "Algo"),
  ]
    .filter(Boolean)
    .join(" and ");

  const message = `This author contributed ${pluralize(
    senderNotes.length,
    "time"
  )} with ${spentText}.`;
  bottomBar.querySelector("span").innerText = message;
  bottomBar.classList.add("open");
  story.classList.add("has-selection");
}

function onStoryHighlight(ev) {
  if (ev.target !== story) {
    highlightStoryParts(ev.target.dataset.sender);
  }
}

function pluralize(amount, unit) {
  if (!amount) {
    return "";
  }
  const text = `${amount} ${unit}`;
  return amount === 1 ? text : `${text}s`;
}

function onStoryHighlightEnd(ev) {
  if (ev.path.indexOf(bottomBar) === -1) {
    senderNotes.forEach((note) => note.classList.remove("selected"));
    bottomBar.classList.remove("open");
    story.classList.remove("has-selection");
  }
}

function toggleSection(ev) {
  const header = ev.currentTarget;
  const body = header.nextElementSibling;

  const { scrollHeight, style, __timeout } = body;
  clearTimeout(__timeout);
  const transitionDuration = Math.max(250, Math.min(500, scrollHeight * 2));
  style.transitionDuration = `${transitionDuration}ms`;

  if (style.height) {
    header.classList.remove("open");
    style.height = `${scrollHeight}px`;
    body.__timeout = setTimeout(() => (style.height = null), 20);
  } else {
    header.classList.add("open");
    style.height = `${scrollHeight}px`;
    body.__timeout = setTimeout(
      () => (style.height = "auto"),
      transitionDuration + 20
    );
  }
}

function supportAuthorTest(ev) {
  highlightStoryParts(document.getElementById("address").innerText);
  document
    .getElementById("support-section")
    .scrollIntoView({ behavior: "smooth", block: "start" });
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
  .getElementById("support-button")
  .addEventListener("click", supportStoryCoins);

document
  .getElementById("support-author-test")
  .addEventListener("click", supportAuthorTest);

document.getElementById("story").addEventListener("click", onStoryHighlight);
window.addEventListener("click", onStoryHighlightEnd, true);

document
  .querySelectorAll(".section-header")
  .forEach((header) => header.addEventListener("click", toggleSection));
