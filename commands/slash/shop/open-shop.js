const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
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
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("صاحب الشوب")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");

      /* =========================
         🔍 التحقق من الإعدادات
      ========================= */
      if (!fs.existsSync(configFile)) {
        return interaction.reply({
          content: "❌ لم يتم تحديد كاتيجوري الشوب بعد",
          ephemeral: true
        });
      }

      const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
      if (!config.categoryId) {
        return interaction.reply({
          content: "❌ كاتيجوري الشوب غير محفوظة",
          ephemeral: true
        });
      }

      const category = interaction.guild.channels.cache.get(config.categoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content: "❌ كاتيجوري الشوب غير موجودة أو تم حذفها، استخدم /set-shop-category من جديد",
          ephemeral: true
        });
      }

      /* =========================
         ⛔ منع تكرار الشوب لنفس الشخص
      ========================= */
      const shops = fs.existsSync(shopsFile)
        ? JSON.parse(fs.readFileSync(shopsFile, "utf8"))
        : {};

      const alreadyHasShop = Object.values(shops).some(
        shop => shop.ownerId === user.id
      );

      if (alreadyHasShop) {
        return interaction.reply({
          content: "❌ هذا المستخدم لديه شوب مفتوح بالفعل",
          ephemeral: true
        });
      }

      /* =========================
         🕒 حساب مدة الشوب (7 أيام)
      ========================= */
      const startsAt = Date.now();
      const endsAt = startsAt + 7 * 24 * 60 * 60 * 1000;

      /* =========================
         📢 إنشاء روم الشوب (الصلاحيات المعدّلة)
      ========================= */

      // نحاول نجيب أي رول عنده Administrator
      const adminRole = interaction.guild.roles.cache.find(
        r => r.permissions.has("Administrator")
      );

      const channel = await interaction.guild.channels.create({
        name: `shop-${user.username}`.toLowerCase(),
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          // 👁️ الجميع يشوف فقط
          {
            id: interaction.guild.roles.everyone.id,
            allow: ["ViewChannel"],
            deny: [
              "SendMessages",
              "AddReactions",
              "CreatePublicThreads",
              "CreatePrivateThreads"
            ]
          },

          // 🛒 صاحب الشوب
          {
            id: user.id,
            allow: [
              "ViewChannel",
              "SendMessages",
              "AttachFiles",
              "EmbedLinks",
              "AddReactions",
              "ReadMessageHistory"
            ]
          },

          // 🛡️ الإدمن (لو فيه رول Admin)
          ...(adminRole
            ? [{
                id: adminRole.id,
                allow: [
                  "ViewChannel",
                  "SendMessages",
                  "ManageChannels",
                  "ManageMessages",
                  "AddReactions"
                ]
              }]
            : [])
        ]
      });

      /* =========================
         🧾 Embed معلومات الشوب
      ========================= */
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle("🛒 شوب مؤجَّر")
        .setDescription(
          `👤 **المالك:** <@${user.id}>\n\n` +
          `📅 **تاريخ البداية:** <t:${Math.floor(startsAt / 1000)}:F>\n` +
          `⏳ **تاريخ الانتهاء:** <t:${Math.floor(endsAt / 1000)}:F>\n\n` +
          `⚠️ الروم مخصص للنشر بواسطة المالك فقط`
        )
        .setFooter({ text: "Obscura • Shop System" });

      await channel.send({ embeds: [embed] });

      /* =========================
         💾 حفظ البيانات
      ========================= */
      shops[channel.id] = {
        ownerId: user.id,
        endsAt,
        warnings: 0
      };

      fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

      /* =========================
         ✅ رد نهائي
      ========================= */
      await interaction.reply({
        content: `✅ تم فتح شوب لـ ${user.tag}`,
        ephemeral: true
      });

    } catch (err) {
      console.error("OPEN SHOP ERROR:", err);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ حصل خطأ أثناء فتح الشوب",
          ephemeral: true
        });
      }
    }
  }
};
