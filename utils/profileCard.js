const {
  createCanvas,
  loadImage,
  registerFont
} = require("canvas");
const path = require("path");

registerFont(path.join(__dirname, "../assets/fonts/Cairo-Bold.ttf"), {
  family: "Cairo"
});

function formatNumber(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${num}`;
}

function shortenText(text, maxLength = 18) {
  if (!text) return "Unknown User";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function getXpRequiredForLevel(level) {
  return Math.pow(level / 0.1, 2);
}

function getCurrentLevelBaseXp(level) {
  return Math.pow((level - 1) / 0.1, 2);
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
  ctx.closePath();
}

function drawCircleImage(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}

async function createProfileCard(data) {
  const width = 1000;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const backgroundPath = path.join(__dirname, "../assets/profile/background.png");

  const {
    username = "Unknown User",
    avatarURL = "https://cdn.discordapp.com/embed/avatars/0.png",
    crowns = 0,
    messageLevel = 1,
    voiceLevel = 1,
    rank = 0,
    usage = 0,
    messageXp = 0
  } = data;

  const safeUsername = shortenText(username, 15);

  const nextLevelXp = getXpRequiredForLevel(messageLevel);
  const currentLevelBaseXp = getCurrentLevelBaseXp(messageLevel);
  const currentProgressXp = Math.max(0, Math.floor(messageXp - currentLevelBaseXp));
  const requiredProgressXp = Math.max(1, Math.floor(nextLevelXp - currentLevelBaseXp));
  const progressPercent = Math.min(1, currentProgressXp / requiredProgressXp);

  // background
  try {
    const bg = await loadImage(backgroundPath);
    ctx.drawImage(bg, 0, 0, width, height);
  } catch {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#140000");
    gradient.addColorStop(0.5, "#360000");
    gradient.addColorStop(1, "#090909");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(0, 0, width, height);

  // glow
  const glowGradient = ctx.createRadialGradient(720, 180, 60, 720, 180, 320);
  glowGradient.addColorStop(0, "rgba(255, 40, 40, 0.28)");
  glowGradient.addColorStop(1, "rgba(255, 40, 40, 0)");
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);

  // outer border
  ctx.strokeStyle = "rgba(255, 45, 45, 0.24)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 20, 20, 960, 460, 28, false, true);

  // left panel
  ctx.fillStyle = "rgba(10, 10, 10, 0.58)";
  drawRoundedRect(ctx, 30, 30, 250, 440, 28, true, false);

  // right panel
  ctx.fillStyle = "rgba(15, 15, 15, 0.20)";
  drawRoundedRect(ctx, 300, 30, 670, 440, 28, true, false);

  // avatar
  const avatar = await loadImage(avatarURL);
  drawCircleImage(ctx, avatar, 58, 56, 140);

  // avatar ring
  ctx.beginPath();
  ctx.arc(128, 126, 76, 0, Math.PI * 2);
  ctx.strokeStyle = "#ff2a36";
  ctx.lineWidth = 5;
  ctx.stroke();

  // username
  ctx.fillStyle = "#ffffff";
  ctx.font = "34px Cairo";
  ctx.fillText(safeUsername, 340, 100);

  // subtitle
  ctx.fillStyle = "#ff2a36";
  ctx.font = "20px Cairo";
  ctx.fillText("DealerX Profile", 340, 138);

  // badge
  ctx.fillStyle = "rgba(255, 30, 46, 0.18)";
  drawRoundedRect(ctx, 340, 158, 170, 40, 14, true, false);

  ctx.fillStyle = "#ffd9dc";
  ctx.font = "18px Cairo";
  ctx.fillText("System User", 362, 185);

  // usage box
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  drawRoundedRect(ctx, 700, 58, 220, 95, 20, true, false);

  ctx.fillStyle = "#ff5964";
  ctx.font = "20px Cairo";
  ctx.fillText("USAGE", 725, 92);

  ctx.fillStyle = "#ffffff";
  ctx.font = "36px Cairo";
  ctx.fillText(formatNumber(usage), 725, 132);

  // left stats
  const startY = 250;
  const gap = 72;

  const stats = [
    { label: "MSG LVL", value: `${messageLevel}`, color: "#ff4b57" },
    { label: "VOICE LVL", value: `${voiceLevel}`, color: "#ffbf66" },
    { label: "CROWNS", value: formatNumber(credits), color: "#8cd4ff" },
    { label: "RANK", value: `#${rank || 0}`, color: "#b992ff" }
  ];

  stats.forEach((item, index) => {
    const y = startY + gap * index;

    ctx.fillStyle = item.color;
    ctx.font = "18px Cairo";
    ctx.fillText(item.label, 58, y);

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Cairo";
    ctx.fillText(item.value, 58, y + 34);
  });

  // progress card
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  drawRoundedRect(ctx, 340, 250, 580, 145, 22, true, false);

  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Cairo";
  ctx.fillText("Message Progress", 370, 292);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "18px Cairo";
  ctx.fillText(`Current XP: ${Math.floor(messageXp)}`, 370, 328);
  ctx.fillText(`Remaining XP: ${Math.max(0, requiredProgressXp - currentProgressXp)}`, 370, 358);

  // bar background
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  drawRoundedRect(ctx, 370, 372, 500, 22, 11, true, false);

  // bar fill
  const progressWidth = 500 * progressPercent;
  const progressGradient = ctx.createLinearGradient(370, 0, 870, 0);
  progressGradient.addColorStop(0, "#c1121f");
  progressGradient.addColorStop(1, "#ff2a36");
  ctx.fillStyle = progressGradient;
  drawRoundedRect(ctx, 370, 372, Math.max(14, progressWidth), 22, 11, true, false);

  // progress text
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Cairo";
  ctx.fillText(`${currentProgressXp} / ${requiredProgressXp}`, 370, 420);

  ctx.fillStyle = "#ffd6d9";
  ctx.font = "17px Cairo";
  ctx.fillText(`TOTAL MESSAGE XP: ${Math.floor(messageXp)}`, 650, 420);

  // footer
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "15px Cairo";
  ctx.fillText("DealerX • Powered Profile Card", 720, 462);

  return canvas.toBuffer("image/png");
}

module.exports = {
  createProfileCard
};
