module.exports = {
  name: 'setstatus',
  aliases: ['status'],
  description: 'Set Discord status (online/idle/dnd/invisible).',
  category: 'utility',
  usage: '<online|idle|dnd|invisible>',
  async execute(message, args, { client, config }) {
    const s = (args[0] || 'idle').toLowerCase();
    if (!['online','idle','dnd','invisible'].includes(s)) return message.channel.send('⬛ Invalid status.');
    client.user.setStatus(s);
    config.update({ status: s });
    message.channel.send(`⬛ Status set to \`${s}\`.`);
  },
};
