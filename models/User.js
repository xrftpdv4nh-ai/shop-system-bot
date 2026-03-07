const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },

  username: String,
  avatar: String,

  credits: {
    type: Number,
    default: 0
  },

  xp: {
    type: Number,
    default: 0
  },

  level: {
    type: Number,
    default: 1
  },

  messageCount: {
    type: Number,
    default: 0
  },

  voiceMinutes: {
    type: Number,
    default: 0
  },

  commandUsage: {
    type: Number,
    default: 0
  },

  usageScore: {
    type: Number,
    default: 0
  },

  rankScore: {
    type: Number,
    default: 0
  },

  lastVoiceJoin: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
