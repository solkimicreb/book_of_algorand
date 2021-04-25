const notification = document.getElementById("notification");
let timeout;

const colors = {
  success: "rgb(0, 120, 50)",
  danger: " #cc0000",
};

export function notify({ message, color = "success" }) {
  notification.innerText = message;
  notification.style.backgroundColor = colors[color];
  notification.style.opacity = 1;
  notification.style.transform = "translate(-50%, 0)";

  clearTimeout(timeout);
  timeout = setTimeout(closeNotification, 4000);
}

function closeNotification() {
  notification.style.opacity = 0;
  notification.style.transform = "translate(-50%, 100%)";
}
