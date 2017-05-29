const Discord = require("discord.js");
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`);
});

client.on('message', msg => {
  if (msg.content === 'nice') {
    msg.react(":tm:");
  }
});

token = require("./config/token.js")

client.login(token.token);
