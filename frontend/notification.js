const notification = document.getElementById("notification");
let id;

export function notify({ message, color = "success", timeout = 4000 }) {
  notification.innerText = message;
  notification.className = `open ${color}`;

  clearTimeout(id);
  if (timeout) {
    id = setTimeout(closeNotification, timeout);
  }
}

export function closeNotification() {
  clearTimeout(id);
  notification.className = "";
}
