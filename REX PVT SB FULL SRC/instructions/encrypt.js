module.exports = {
  name: 'encrypt',
  description: 'ENCRYPT A MESSAGE USING A GLITCHED-OUT CIPHER',
  execute(message, args) {
    if (args.length === 0) {
      return message.channel.send('❗ PLEASE PROVIDE A MESSAGE TO ENCRYPT.');
    }

    const text = args.join(' ');
    const encryptedText = glitchEncrypt(text); // GLITCHED ENCRYPTION FUNCTION

    message.channel.send(`🛡️ ENCRYPTED MESSAGE: \`${encryptedText}\``);
  }
};

// FUNCTION TO PERFORM "GLITCHED" ENCRYPTION WITH RANDOM SPECIAL CHARACTERS
function glitchEncrypt(str) {
  const glitchCharacters = ['҉', '∂', 'Ҝ', 'ε', 'ł', 'σ', '∑', 'ř', '∫', '¥', '∂', 'Σ', '∂', '∇', 'λ'];
  return str.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      // RANDOMLY REPLACE SOME CHARACTERS WITH "GLITCHED" SYMBOLS
      const glitch = Math.random() < 0.3 ? glitchCharacters[Math.floor(Math.random() * glitchCharacters.length)] : char;
      return glitch;
    }
    return char; // NON-ALPHABET CHARACTERS REMAIN UNCHANGED
  }).join('');
}
