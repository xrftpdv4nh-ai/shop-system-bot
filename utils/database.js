const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database", "guilds.json");

function ensureDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  readDB,
  writeDB
};
