// show.js
const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");
module.exports = {
  data: new SlashCommandBuilder().setName("show").setDescription("إظهار الروم"),
  async execute(i){
    if(!hasAdminAccess(i.member)) return i.reply({content:"❌",ephemeral:true});
    await i.channel.permissionOverwrites.edit(i.guild.id,{ ViewChannel:true });
    i.reply("👁️ تم إظهار الروم");
  }
};
