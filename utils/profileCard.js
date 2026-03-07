const {
  createCanvas,
  loadImage,
  registerFont
} = require("canvas");
const path = require("path");

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
  const width = 1200;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const backgroundPath = path.join(__dirname, "../assets/profile/background.png");

  const {
    username = "Unknown User",
    avatarURL = "https://cdn.discordapp.com/embed/avatars/0.png",
    credits = 0,
    messageLevel = 1,
    voiceLevel = 1,
    rank = 0,
    usage = 0,
    messageXp = 0
  } = data;

  const safeUsername = shortenText(username, 16);

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

  // dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.fillRect(0, 0, width, height);

  // glow
  const glowGradient = ctx.createRadialGradient(860, 220, 80, 860, 220, 420);
  glowGradient.addColorStop(0, "rgba(255, 40, 40, 0.26)");
  glowGradient.addColorStop(1, "rgba(255, 40, 40, 0)");
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);

  // left panel
  ctx.fillStyle = "rgba(12, 12, 12, 0.58)";
  drawRoundedRect(ctx, 36, 36, 350, 528, 36, true, false);

  // right panel
  ctx.fillStyle = "rgba(15, 15, 15, 0.22)";
  drawRoundedRect(ctx, 410, 36, 754, 528, 36, true, false);

  // border glow
  ctx.strokeStyle = "rgba(255, 45, 45, 0.24)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 36, 36, 1128, 528, 36, false, true);

  // avatar
  const avatar = await loadImage(avatarURL);
  drawCircleImage(ctx, avatar, 82, 82, 190);

  // avatar ring
  ctx.beginPath();
  ctx.arc(177, 177, 101, 0, Math.PI * 2);
  ctx.strokeStyle = "#ff2a36";
  ctx.lineWidth = 6;
  ctx.stroke();

  // logo text
  ctx.font = "bold 46px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(safeUsername, 430, 135);

  ctx.font = "bold 26px Sans";
  ctx.fillStyle = "#ff2a36";
  ctx.fillText("DealerX Profile", 430, 180);

  // small badge
  ctx.fillStyle = "rgba(255, 30, 46, 0.18)";
  drawRoundedRect(ctx, 430, 205, 210, 48, 18, true, false);
  ctx.font = "bold 22px Sans";
  ctx.fillStyle = "#ffd9dc";
  ctx.fillText("System User", 462, 237);

  // left stats labels
  const startY = 318;
  const gap = 78;

  const stats = [
    { label: "MSG LVL", value: `${messageLevel}`, color: "#ff4b57" },
    { label: "VOICE LVL", value: `${voiceLevel}`, color: "#ffbf66" },
    { label: "CREDITS", value: formatNumber(credits), color: "#8cd4ff" },
    { label: "RANK", value: `#${rank || 0}`, color: "#b992ff" }
  ];

  stats.forEach((item, index) => {
    const y = startY + gap * index;

    ctx.font = "bold 24px Sans";
    ctx.fillStyle = item.color;
    ctx.fillText(item.label, 84, y);

    ctx.font = "bold 44px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(item.value, 84, y + 42);
  });

  // usage box
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  drawRoundedRect(ctx, 700, 82, 380, 120, 28, true, false);
  ctx.font = "bold 28px Sans";
  ctx.fillStyle = "#ff5964";
  ctx.fillText("USAGE", 740, 130);
  ctx.font = "bold 52px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(formatNumber(usage), 740, 185);

  // main info panel
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  drawRoundedRect(ctx, 430, 305, 650, 180, 26, true, false);

  ctx.font = "bold 30px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Message Progress", 470, 355);

  ctx.font = "24px Sans";
  ctx.fillStyle = "#d7d7d7";
  ctx.fillText(`Current XP: ${Math.floor(messageXp)}`, 470, 398);
  ctx.fillText(`Remaining XP: ${Math.max(0, requiredProgressXp - currentProgressXp)}`, 470, 436);

  // progress bar bg
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  drawRoundedRect(ctx, 470, 455, 560, 28, 14, true, false);

  // progress fill
  const progressWidth = 560 * progressPercent;
  const progressGradient = ctx.createLinearGradient(470, 0, 1030, 0);
  progressGradient.addColorStop(0, "#c1121f");
  progressGradient.addColorStop(1, "#ff2a36");
  ctx.fillStyle = progressGradient;
  drawRoundedRect(ctx, 470, 455, Math.max(18, progressWidth), 28, 14, true, false);

  // progress text
  ctx.font = "bold 22px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${currentProgressXp} / ${requiredProgressXp}`, 470, 520);

  // total xp bottom right
  ctx.font = "bold 24px Sans";
  ctx.fillStyle = "#ffd6d9";
  ctx.fillText(`TOTAL MESSAGE XP: ${Math.floor(messageXp)}`, 760, 520);

  // footer
  ctx.font = "20px Sans";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("DealerX • Powered Profile Card", 835, 560);

  return canvas.toBuffer("image/png");
}

module.exports = {
  createProfileCard
};
