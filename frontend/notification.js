const notification = document.getElementById("notification");
let id;

export function notify({ message, color = "secondary", timeout = 4000 }) {
  notification.innerText = message;
  notification.className = color;

  Object.assign(notification.style, {
    top: "15px",
    transform: "translate(-50%, 0)",
  });

  clearTimeout(id);
  if (timeout) {
    id = setTimeout(closeNotification, timeout);
  }
}

export function closeNotification() {
  clearTimeout(id);

  Object.assign(notification.style, {
    top: 0,
    transform: "translate(-50%, -100%)",
  });
}
