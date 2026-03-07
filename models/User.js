const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },

  username: {
    type: String,
    default: ""
  },

  avatar: {
    type: String,
    default: null
  },

  accessToken: {
    type: String,
    default: null
  },

  refreshToken: {
    type: String,
    default: null
  },

  guilds: {
    type: Array,
    default: []
  },

  credits: {
    type: Number,
    default: 0
  },

  messageXp: {
    type: Number,
    default: 0
  },

  messageLevel: {
    type: Number,
    default: 1
  },

  messageCount: {
    type: Number,
    default: 0
  },

  voiceXp: {
    type: Number,
    default: 0
  },

  voiceLevel: {
    type: Number,
    default: 1
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
  },

  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
