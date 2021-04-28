function handleError(err, req, res, next) {
  console.error(err, err.stack);
  res.status(500).send({ message: "Something went wrong!" });
}

function wrap(middleware) {
  return (req, res, next) =>
    Promise.resolve(middleware(req, res, next)).catch(next);
}

module.exports = {
  handleError,
  wrap,
};
