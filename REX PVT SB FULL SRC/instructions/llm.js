const Groq = require('groq-sdk');

let messageHistory = [];
let awaitingReplies = new Map();

module.exports = {
  name: 'llm',
  async execute(message, args, config, groq) {
    if (args.length === 0) {
      return message.channel.send('❗ PLEASE PROVIDE A QUESTION.');
    }

    const question = args.join(' ');
    const userId = message.author.id;

    // ADD THE USER'S QUESTION TO HISTORY
    messageHistory.push({ role: "user", content: question });

    try {
      const response = await getGroqChatCompletion(messageHistory, groq);

      // SEND THE RESPONSE IN CODE BLOCKS
      const responseMessage = await message.channel.send(`\`\`\`${response}\`\`\``);
      
      // UPDATE MESSAGE HISTORY WITH THE ASSISTANT'S RESPONSE
      messageHistory.push({ role: "assistant", content: response });

      // TRACK THE MESSAGE FOR REPLIES
      awaitingReplies.set(responseMessage.id, userId);

      // OPTIONALLY, UNCOMMENT THE LINE BELOW TO DELETE THE QUESTION MESSAGE
      // await message.delete();
    } catch (error) {
      console.error('❌ ERROR PROCESSING LLM REQUEST:', error);
      message.channel.send('❗ FAILED TO GET A RESPONSE FROM THE LLM.');
    }
  }
};

async function getGroqChatCompletion(messages, groq) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama3-8b-8192",
    });
    return chatCompletion.choices[0]?.message?.content || "❌ NO RESPONSE FROM THE LLM.";
  } catch (error) {
    console.error('❌ ERROR FETCHING CHAT COMPLETION:', error);
    throw new Error('❗ FAILED TO FETCH CHAT COMPLETION.');
  }
}

module.exports.listenForReplies = async (message, groq) => {
  // CHECK IF THE MESSAGE IS A REPLY TO A TRACKED LLM MESSAGE
  if (message.reference && message.reference.messageId) {
    const originalMessageId = message.reference.messageId;

    if (awaitingReplies.has(originalMessageId)) {
      const userId = awaitingReplies.get(originalMessageId);

      // CHECK IF THE REPLY IS FROM THE SAME USER
      if (message.author.id === userId) {
        // ADD THE USER'S REPLY TO HISTORY
        messageHistory.push({ role: "user", content: message.content });
        awaitingReplies.delete(originalMessageId);

        try {
          // GENERATE A NEW RESPONSE BASED ON UPDATED HISTORY
          const response = await getGroqChatCompletion(messageHistory, groq);
          const responseMessage = await message.channel.send(`\`\`\`${response}\`\`\``);
          
          // UPDATE MESSAGE HISTORY WITH THE ASSISTANT'S RESPONSE
          messageHistory.push({ role: "assistant", content: response });
        } catch (error) {
          console.error('❌ ERROR PROCESSING LLM REPLY:', error);
          message.channel.send('❗ FAILED TO GET A RESPONSE FROM THE LLM.');
        }
      }
    }
  }
};
