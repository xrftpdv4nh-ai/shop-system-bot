module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    // هنا هنضيف بعدين:
    // - setline here
    // - إرسال صورة الخط
    // - حماية السبام
  }
};
