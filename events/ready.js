module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: "System Shop | Setup" }],
      status: "online"
    });
  }
};
