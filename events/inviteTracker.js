const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    client.invites = new Map();

    for (const guild of client.guilds.cache.values()) {
      const invites = await guild.invites.fetch();
      client.invites.set(
        guild.id,
        new Map(invites.map(invite => [invite.code, invite.uses]))
      );
    }

    console.log("✅ Invite system ready");
  }
};
