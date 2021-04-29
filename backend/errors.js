function handleError(err, req, res, next) {
  console.error(err, err.response, err.stack);

  const status = err.status || 500;
  let body;
  try {
    body = JSON.parse(err.response.text);
  } catch (err) {
    body = { message: "Something went wrong!" };
  }

  res.status(status).send(body);
}

function wrap(middleware) {
  return (req, res, next) =>
    Promise.resolve(middleware(req, res, next)).catch(next);
}

module.exports = {
  handleError,
  wrap,
};
