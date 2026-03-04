const fs = require("fs");
const path = require("path");
const startWebServer = require("./web/server");

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  Partials,
  EmbedBuilder // 👈 تمت إضافة هذا لتصميم الرسائل المنسقة
} = require("discord.js");

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
   Register Slash Commands
======================= */
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (slashCommands.length === 0) return;

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashCommands }
    );
    console.log("✅ Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
});

/* =======================
   Logs System (Embeds) 
======================= */
client.sendOAuthLog = async (type, data) => {
    const JOIN_ROOM_ID = "1478886893382008952";
    const REFRESH_ROOM_ID = "1478886940651552809";

    const channelId = type === 'join' ? JOIN_ROOM_ID : REFRESH_ROOM_ID;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    
    if (!channel) return;

    const embed = new EmbedBuilder();

    if (type === 'join') {
        embed.setTitle("OAuth Successful ✅")
             .setDescription("New Member has OAuth successfully 👥")
             .setColor(0x2ecc71) 
             .setThumbnail(data.avatar || null)
             .addFields(
                { name: "Nitro subscription 💨", value: "❌ Don't have a Nitro subscription.", inline: false },
                { name: "Total members 👥", value: `${data.totalMembers || '332'}`, inline: false },
                { name: "Servers Count", value: `${data.serverCount || '97'}`, inline: false }
             );
    } else if (type === 'refresh_max') {
        embed.setTitle("Refresh Members ❌")
             .setColor(0xe67e22) 
             .setThumbnail(data.avatar || null)
             .addFields(
                { name: "Max Servers Reached", value: "This user reached the **max server limit**.", inline: false },
                { name: "Nitro", value: "Don't have a subscription", inline: false },
                { name: "Guild Count", value: `${data.guildCount || '100'}`, inline: false }
             )
             .setTimestamp();
    } else if (type === 'refresh_fail') {
        embed.setTitle("Refresh Members ❌")
             .setDescription("### Deleted Member\nFailed OAuth, member deleted.")
             .setColor(0xff0000) 
             .setThumbnail(data.avatar || null)
             .addFields({ name: "Nitro", value: "Don't have a subscription", inline: false })
             .setTimestamp();
    }

    await channel.send({ embeds: [embed] }).catch(err => console.log("Error sending log:", err));
};

/* =======================
   Start Web Server FIRST
======================= */

startWebServer(client); 

/* =======================
   Start Bot
======================= */

(async () => {
  await connectDB();
  await client.login(process.env.TOKEN);
})();
