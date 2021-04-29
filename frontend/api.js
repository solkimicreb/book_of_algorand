import { notify } from "./notification";

if (!window.fetch) {
  import("whatwg-fetch");
}

const loader = document.getElementById("loader");

function fetchResource(path = "", method, body) {
  if (!window.fetch) {
    console.error("Fetch is not yet loaded");
    return;
  }

  return window
    .fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    .then((resp) => Promise.all([400 <= resp.status, resp.json()]))
    .then(([isError, body]) => {
      if (body.message) {
        notify({
          message: body.message,
          color: isError ? "danger" : "success",
        });
      }
      if (isError) {
        throw body;
      }
      return body;
    });
}

export function get(path) {
  return fetchResource(path, "GET");
}

export function post(path, body) {
  loader.classList.add("loading");
  return fetchResource(path, "POST", body).then(postSuccess, postError);
}

function postSuccess(resp) {
  loader.style.display = "none";
  return resp;
}

function postError(err) {
  loader.classList.remove("loading");
  throw err;
}
