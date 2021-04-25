function handleError(err, req, res, next) {
  console.error(err, err.stack);
  res.status(500).send({ message: "Oops! Something is not right!" });
}

function wrap(middleware) {
  return (req, res, next) =>
    Promise.resolve(middleware(req, res, next)).catch(next);
}

module.exports = {
  handleError,
  wrap,
};
