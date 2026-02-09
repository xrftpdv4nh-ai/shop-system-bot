// mute.js
const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");
module.exports = {
  data: new SlashCommandBuilder().setName("mute").setDescription("ميوت (24 ساعة)")
    .addUserOption(o=>o.setName("user").setDescription("العضو").setRequired(true)),
  async execute(i){
    if(!hasAdminAccess(i.member)) return i.reply({content:"❌",ephemeral:true});
    const m=await i.guild.members.fetch(i.options.getUser("user").id);
    await m.timeout(24*60*60*1000);
    i.reply("🔇 تم الميوت");
  }
};
