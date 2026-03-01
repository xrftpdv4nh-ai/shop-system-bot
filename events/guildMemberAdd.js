const { Events } = require("discord.js");

const INVITE_CHANNEL_ID = "1477443319889002567";

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const client = member.client;

    const newInvites = await member.guild.invites.fetch();
    const oldInvites = client.invites.get(member.guild.id);

    const usedInvite = newInvites.find(invite => {
      const previousUses = oldInvites.get(invite.code);
      return invite.uses > previousUses;
    });

    if (!usedInvite) return;

    const inviter = usedInvite.inviter;

    // تحديث الكاش
    client.invites.set(
      member.guild.id,
      new Map(newInvites.map(invite => [invite.code, invite.uses]))
    );

    const channel = member.guild.channels.cache.get(INVITE_CHANNEL_ID);
    if (!channel) return;

    await channel.send(
      `👋 ${member} joined! Invited by ${inviter} (Total invites: ${usedInvite.uses})`
    );
  }
};
