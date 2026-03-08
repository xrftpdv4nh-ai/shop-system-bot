const mongoose = require("mongoose");

const commandSettingSchema = new mongoose.Schema({
  disabled: {
    type: Boolean,
    default: false
  },

  roles: {
    type: [String],
    default: []
  },

  channels: {
    type: [String],
    default: []
  },

  alias: {
    type: String,
    default: ""
  }
}, { _id: false });

const guildConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },

  guildName: {
    type: String,
    default: ""
  },

  guildIcon: {
    type: String,
    default: null
  },

  commandSettings: {
    profile: { type: commandSettingSchema, default: () => ({}) },
    crowns: { type: commandSettingSchema, default: () => ({}) },
    daily: { type: commandSettingSchema, default: () => ({}) },
    top: { type: commandSettingSchema, default: () => ({}) },
    leaderboard: { type: commandSettingSchema, default: () => ({}) }
  }
}, {
  timestamps: true
});

module.exports =
  mongoose.models.GuildConfig ||
  mongoose.model("GuildConfig", guildConfigSchema);
