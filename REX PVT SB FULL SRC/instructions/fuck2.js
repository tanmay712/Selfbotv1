module.exports = {
  name: 'fuck2',
  async execute(message, args, config) {
    const user = message.mentions.users.first();
    if (!user) return message.channel.send("❗ Please mention a user.");

    await message.delete();

    const lines = [
      " MADARCHOD.",
      " BOKA CHUDA.",
      " RENDI CHUDA.",
      " VIRAS CHUDA.",
      " PC CHUDA.",
      " PHONE CHUDA.",
      " CHABI CHUDA.",
      " INSAN CHUDA.",
      " KUTUPMINAR CHUDA.",
      " CHINA CHUDA.",
      " AMERICA CHUDA.",
      " INDIA CHUDA.",
      " TUTH BRUSH CHUDA.",
      " PENTI CHUDA.",
      " UNDER WEAR CHUDA.",
      " BRA CHUDA.",
      " GANGI CHUDA",
      " BURGER CHUDA",
      " CHIKEN CHUDA",
      " KANCHI CHUDA",
      " TV CHUDA",
      " MOBILE CHARGER CHUDA",
      " KEYBORD CHUDA",
      " MOUSE CHUDA",
      " GADI CHUDA",
      " REDIO TOWER CHUDA",
      " WATER CHUDA",
      " BOTEL CHUDA",
      " UPS CHUDA",
      " MONITOR CHUDA",
      " SPEAKER CHUDA",
      " GHAT KA BAL CHUDA",
      " KELLA CHUDA",
      " APPLE CHUDA",
      " ROUTER CHUDA",
      " BKL"
    ];

    for (const line of lines) {
      await message.channel.send(`# ${user} ${line.toUpperCase()}`);
    }
  }
};
