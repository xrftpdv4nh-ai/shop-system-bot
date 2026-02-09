const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require("discord.js");

// ⬅️ ربط MongoDB
const connectDB = require("./database/connect");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* =======================
   Slash Commands Loader
======================= */

client.commands = new Collection();
const commands = [];

const commandsPath = path.join(__dirname, "commands", "slash");
if (fs.existsSync(commandsPath)) {
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.log(`⚠️ Command skipped: ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
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
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

/* =======================
   Register Slash Commands
======================= */

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (commands.length === 0) {
    console.log("ℹ️ No slash commands to register");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
});

/* =======================
   Start Bot (Mongo + Discord)
======================= */

(async () => {
  await connectDB();              // ⬅️ يتأكد إن Mongo اشتغل
  await client.login(process.env.TOKEN); // ⬅️ توكن من Railway
})();
