// lock.js
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");
module.exports = {
  data: new SlashCommandBuilder().setName("lock").setDescription("قفل الروم"),
  async execute(i){
    if(!hasAdminAccess(i.member)) return i.reply({content:"❌",ephemeral:true});
    await i.channel.permissionOverwrites.edit(i.guild.id,{ SendMessages:false });
    i.reply("🔒 تم قفل الروم");
  }
};
