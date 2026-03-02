const express = require("express");

function startWebServer(client) {

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get("/", (req, res) => {

    const botStatus = client.isReady() ? "🟢 Online" : "🔴 Offline";
    const guildCount = client.guilds.cache.size;

    const userCount = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );

    const ping = client.ws.ping;

    res.send(`
      <html>
        <head>
          <title>DealerX Dashboard</title>
          <style>
            body {
              background: #0f0f0f;
              color: white;
              font-family: Arial;
              text-align: center;
              padding-top: 50px;
            }
            .card {
              background: #1a1a1a;
              padding: 20px;
              margin: 20px auto;
              width: 400px;
              border-radius: 10px;
              box-shadow: 0 0 10px #000;
            }
            h1 { color: #C1121F; }
          </style>
        </head>
        <body>

          <h1>DealerX Dashboard</h1>

          <div class="card">
            <h2>Status</h2>
            <p>${botStatus}</p>
          </div>

          <div class="card">
            <h2>Servers</h2>
            <p>${guildCount}</p>
          </div>

          <div class="card">
            <h2>Users</h2>
            <p>${userCount}</p>
          </div>

          <div class="card">
            <h2>Ping</h2>
            <p>${ping} ms</p>
          </div>

        </body>
      </html>
    `);
  });

  const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("🌐 Dashboard running on port " + PORT);
});

}

module.exports = startWebServer;
