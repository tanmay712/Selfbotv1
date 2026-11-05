module.exports = {
    name: "activity",
    description: "Set a custom activity status.",
    aliases: ["setactivity", "status"],
    async execute(message, args, config, groq, client) {
      if (args.length < 2) {
        return message.channel.send("```❌ USAGE: $ACTIVITY <type> <message>\nTYPES: PLAYING, STREAMING, LISTENING, WATCHING```");
      }
  
      const type = args.shift().toUpperCase();
      const activityMessage = args.join(" ");
  
      const activityTypes = {
        PLAYING: "PLAYING",
        STREAMING: "STREAMING",
        LISTENING: "LISTENING",
        WATCHING: "WATCHING"
      };
  
      if (!activityTypes[type]) {
        return message.channel.send("```❌ INVALID TYPE. USE: PLAYING, STREAMING, LISTENING, WATCHING```");
      }
  
      try {
        if (type === "STREAMING") {
          client.user.setActivity(activityMessage, { type: "STREAMING", url: "https://twitch.tv/yourchannel" });
        } else {
          client.user.setActivity(activityMessage, { type: activityTypes[type] });
        }
  
        message.channel.send(`\`\`\`✅ ACTIVITY SET TO: ${type} ${activityMessage}\`\`\``);
      } catch (error) {
        console.error("❌ ERROR SETTING ACTIVITY:", error);
        message.channel.send("```❌ FAILED TO SET ACTIVITY.```");
      }
    }
  };
  