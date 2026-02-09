// unmute.js
const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");
module.exports = {
  data: new SlashCommandBuilder().setName("unmute").setDescription("فك الميوت")
    .addUserOption(o=>o.setName("user").setDescription("العضو").setRequired(true)),
  async execute(i){
    if(!hasAdminAccess(i.member)) return i.reply({content:"❌",ephemeral:true});
    const m=await i.guild.members.fetch(i.options.getUser("user").id);
    await m.timeout(null);
    i.reply("🔊 تم فك الميوت");
  }
};
