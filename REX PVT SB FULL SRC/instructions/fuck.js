module.exports = {
  name: 'fuck',
  async execute(message, args, config) {
    if (args.length < 1) {
      return message.channel.send(`\Usage: ${config.prefix}fuck <mentionuser>`);
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.channel.send(`\`\`\`❗ Please mention a user.\`\`\``);
    }

    try {
      await message.delete();

      const insults = [
        `${user} TERI MAA KE CH*T`,
        `${user} L*UND K BAL BOSDK`,
        `${user} TERI KA KA RE*P KAR K LASH TERI G*ND MAI DAL DUNGA`,
        `${user} TERI MAA KE CH*T MAI SUTLI BAM DAL K FOD DUNGA LULI KE GHAT`,
        `${user} TERA BAP MERA L*ND CHUNTA THA APNA GHAR CHALANE K LIYEA`,
        `${user} RE*DI K GHAT`,
        `${user} BHADWE KE AULAD`,
        `${user} TERI AUKAT MERA LU*ND CHUSNE KE H`,
        `${user} JA APNI RE*DI MAA KA DUD PE K AA MERSE BHIDNE SE PAHALE`,
        `${user} AND FIR AA K LUND CHUS MERA`,
        `${user} 150 MAI CH*T MARWANE WALE RE*DI KE AULAD`,
        `${user} L*ND SE SHAKAL KA BETI CH*D`,
        `${user} TERE JAISE K MUH PE MUTA BHE NAHI MAI`,
        `${user} GHASTI KE RANDI`,
        `${user} TERE BAP KA LU*D KAT K CH*T BANA DUNGA MAI`,
        `${user} GASTI KE RE*DI SALA`,
        `${user} TERI MAA SE PUCH TU KAISE PAIDA HUYA THA BEHEN K L*ND`,
        `${user} TU TO GALTI SE PAIDA HO GYA L*ND K BECTRIYA`,
        `${user} TU TO ITNA N*GGA HAI KE INSTA K FILTER BHE TUJHE SPOT NAHI KAREGA`,
        `${user} N*GGA MADARCH*D`
      ];

      for (const line of insults) {
        await message.channel.send(line);
      }

    } catch (error) {
      console.error('Error sending messages:', error);
      message.channel.send(`\`\`\`❌ An error occurred while trying to send messages.\`\`\``);
    }
  }
};
