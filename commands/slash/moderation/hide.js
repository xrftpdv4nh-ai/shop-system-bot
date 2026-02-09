// hide.js
const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");
module.exports = {
  data: new SlashCommandBuilder().setName("hide").setDescription("إخفاء الروم"),
  async execute(i){
    if(!hasAdminAccess(i.member)) return i.reply({content:"❌",ephemeral:true});
    await i.channel.permissionOverwrites.edit(i.guild.id,{ ViewChannel:false });
    i.reply("🙈 تم إخفاء الروم");
  }
};
