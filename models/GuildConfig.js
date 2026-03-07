const mongoose = require("mongoose");

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

  disabledCommands: {
    type: [String],
    default: []
  },

  commandRoles: {
    type: Map,
    of: [String],
    default: {}
  },

  commandChannels: {
    type: Map,
    of: [String],
    default: {}
  },

  shortcuts: {
    type: [
      {
        name: String,
        content: String
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

module.exports =
  mongoose.models.GuildConfig ||
  mongoose.model("GuildConfig", guildConfigSchema);
