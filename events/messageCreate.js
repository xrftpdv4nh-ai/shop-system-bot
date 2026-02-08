module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    // أمر تجريبي
    if (message.content.toLowerCase() === "ping") {
      return message.reply("pong 🏓");
    }

    // هنا هنضيف بعدين:
    // - أوامر setline
    // - System Line
  }
};
