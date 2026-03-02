// database/OAuthUser.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  discordId: { type: String, unique: true },
  username: String,
  accessToken: String,
  refreshToken: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OAuthUser", schema);
