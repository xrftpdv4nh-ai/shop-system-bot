const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const shopsFile = path.join(__dirname, "../../../database/shops.json");
const configFile = path.join(__dirname, "../../../database/shopConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("open-shop")
    .setDescription("فتح روم شوب لشخص")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("صاحب الشوب")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const config = JSON.parse(fs.readFileSync(configFile));

    const endsAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const channel = await interaction.guild.channels.create({
      name: `shop-${user.username}`,
      type: 0,
      parent: config.categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ["SendMessages"]
        },
        {
          id: user.id,
          allow: ["ViewChannel", "SendMessages"]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🛒 شوب مؤجر")
      .setColor(0x2b2d31)
      .setDescription(
        `👤 **المالك:** <@${user.id}>\n` +
        `📅 **تاريخ البداية:** <t:${Math.floor(Date.now()/1000)}>\n` +
        `⏳ **تاريخ الانتهاء:** <t:${Math.floor(endsAt/1000)}>`
      )
      .setFooter({ text: "Obscura • Shop System" });

    await channel.send({ embeds: [embed] });

    const shops = fs.existsSync(shopsFile)
      ? JSON.parse(fs.readFileSync(shopsFile))
      : {};

    shops[channel.id] = {
      ownerId: user.id,
      endsAt
    };

    fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

    interaction.reply({ content: `✅ تم فتح شوب لـ ${user.tag}`, ephemeral: true });
  }
};
