const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");

const frontendPath = path.join(__dirname, "..", "dist");
const frontendFile = fs.readFileSync(path.join(frontendPath, "index.html"), {
  encoding: "utf8",
});
const frontendTemplate = handlebars.compile(frontendFile);

module.exports = {
  frontendPath,
  frontendTemplate,
};
