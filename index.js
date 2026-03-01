const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  Partials,
  EmbedBuilder
} = require("discord.js");

// ⬅️ ربط MongoDB
const connectDB = require("./database/connect");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ],
  partials: [Partials.GuildMember]
});

const PREFIX = "$";

client.commands = new Collection();
client.prefixCommands = new Collection();

/* =======================
   Prefix Commands Loader
======================= */

const prefixPath = path.join(__dirname, "commands", "prefix");
if (fs.existsSync(prefixPath)) {
  const prefixFiles = fs
    .readdirSync(prefixPath)
    .filter(file => file.endsWith(".js"));

  for (const file of prefixFiles) {
    const command = require(`./commands/prefix/${file}`);
    if (!command.name || !command.execute) continue;
    client.prefixCommands.set(command.name, command);
  }
}

/* =======================
   Slash Commands Loader
======================= */

const slashCommands = [];

const slashPath = path.join(__dirname, "commands", "slash");
if (fs.existsSync(slashPath)) {
  const folders = fs.readdirSync(slashPath);

  for (const folder of folders) {
    const folderPath = path.join(slashPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs
      .readdirSync(folderPath)
      .filter(file => file.endsWith(".js"));

    for (const file of files) {
      const command = require(`./commands/slash/${folder}/${file}`);
      if (!command.data || !command.execute) continue;

      client.commands.set(command.data.name, command);
      slashCommands.push(command.data.toJSON());
    }
  }
}

/* =======================
   Events Loader
======================= */

const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (!event.name || !event.execute) continue;

    if (event.once) {
      client.once(event.name, (...args) =>
        event.execute(...args, client)
      );
    } else {
      client.on(event.name, (...args) =>
        event.execute(...args, client)
      );
    }
  }
}

/* =======================
   Prefix Handler
======================= */

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX)) return;
  if (message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply("❌ حدث خطأ أثناء تنفيذ الأمر.");
  }
});

/* =======================
   Slash + Button Handler
======================= */

client.on("interactionCreate", async (interaction) => {

  // Slash
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Error executing command.",
        ephemeral: true
      });
    }
  }

  // Button ترجمة القوانين
  client.on("interactionCreate", async (interaction) => {

  // زر الترجمة
  if (interaction.isButton()) {

    if (interaction.customId === "rules_ar") {

      const { EmbedBuilder } = require("discord.js");

      const arabicEmbed = new EmbedBuilder()
        .setColor("#C1121F")
        .setTitle("DealerX - القوانين الرسمية")
        .setDescription(`
بمجرد انضمامك إلى DealerX فأنت توافق على الالتزام بجميع القوانين التالية.

━━━━━━━━━━━━━━━━━━
🔹 **السلوك العام**

1. احترام جميع الأعضاء والإدارة.
2. يمنع الإساءة أو العنصرية أو خطاب الكراهية.
3. يمنع المحتوى الإباحي أو غير اللائق.
4. يمنع المحتوى العنيف أو المزعج.
5. الالتزام بشروط استخدام ديسكورد.
6. يمنع انتحال شخصية الإدارة أو الأعضاء.
7. يجب أن تكون الأسماء والصور مناسبة.
8. استخدام اللغة المسموح بها في كل روم.

━━━━━━━━━━━━━━━━━━
💬 **قوانين الشات**

9. يمنع السبام أو تكرار الرسائل.
10. يمنع النسخ واللصق المتكرر.
11. يمنع الإعلانات بدون إذن.
12. يمنع نشر روابط سيرفرات أخرى.
13. تجنب المشاكل والسلوك السام.
14. الالتزام بموضوع الروم.

━━━━━━━━━━━━━━━━━━
🛠 **الدعم الفني**

15. استخدم الروم الصحيح للدعم.
16. اشرح مشكلتك بوضوح.
17. لا تزعج الإدارة بدون سبب.
18. لا تفتح أكثر من تذكرة لنفس المشكلة.
19. البلاغات الكاذبة تعرضك للعقوبة.

━━━━━━━━━━━━━━━━━━
🤖 **قوانين البوت**

20. يمنع استغلال أو محاولة كسر DealerX.
21. يمنع نسخ أو سرقة البوت.
22. البلاغات يجب أن تكون حقيقية فقط.

━━━━━━━━━━━━━━━━━━
🔐 **الخصوصية**

23. يمنع مشاركة معلومات شخصية.
24. يمنع الروابط الخبيثة أو الاحتيالية.

━━━━━━━━━━━━━━━━━━
⚖ **التنفيذ**

25. قرارات الإدارة نهائية.
26. العقوبات تصاعدية حسب المخالفة.
27. محاولة الهروب من العقوبة تؤدي لعقوبة أشد.
28. الجهل بالقوانين ليس عذرًا.
29. القوانين قابلة للتحديث في أي وقت.

━━━━━━━━━━━━━━━━━━
DealerX Protection System
        `)
        .setImage("https://i.ibb.co/mFzrdBz6/D95-FDA5-A-CA9-C-40-D6-B6-F9-AEA8957-E7-D58.jpg");

      await interaction.reply({
        embeds: [arabicEmbed],
        ephemeral: true
      });
    }
  }

}); // 🔥 ده القوس اللي كان ناقص عندك
}

});
/* =======================
   Register Slash Commands
======================= */

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (slashCommands.length === 0) {
    console.log("ℹ️ No slash commands found.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashCommands }
    );
    console.log("✅ Slash commands registered.");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
});

/* =======================
   Start Bot
======================= */

(async () => {
  await connectDB();
  await client.login(process.env.TOKEN);
})();
