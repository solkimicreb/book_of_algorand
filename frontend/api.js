import { notify } from "./notification";

if (!window.fetch) {
  import("whatwg-fetch");
}

function fetchResource(path = "", method, body) {
  if (!window.fetch) {
    console.error("Fetch is not yet loaded");
    returtn;
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
        throw new Error(body);
      }
      return body;
    });
}

export function get(path) {
  return fetchResource(path, "GET");
}

export function post(path, body) {
  return fetchResource(path, "POST", body);
}
