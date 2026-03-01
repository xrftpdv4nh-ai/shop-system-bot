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
  if (interaction.isButton() && interaction.customId === "rules_ar") {

    const arabicEmbed = new EmbedBuilder()
      .setColor("#C1121F")
      .setTitle("DealerX - القوانين الرسمية")
      .setDescription("تم عرض النسخة العربية الكاملة للقوانين.")
      .setImage("https://i.ibb.co/mFzrdBz6/D95-FDA5-A-CA9-C-40-D6-B6-F9-AEA8957-E7-D58.jpg");

    await interaction.reply({
      embeds: [arabicEmbed],
      ephemeral: true
    });
  }

}); // 🔥 ده القوس اللي كان ناقص عندك

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
