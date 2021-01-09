require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require('./commands');

// Object.keys(botCommands).map(key => {
//   bot.commands.set(botCommands[key].name, botCommands[key]);
// });

const TOKEN = process.env.TOKEN;
const today = new Date();

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async (msg) => {

  // only doing this for the feedback channel for now
  if (msg.channel.name !== "feedback") {
    return;
  }

  const msgContent = msg.content;
  // true if the message contains a URL
  const hasLink = containsUrl(msgContent);
  // TODO also check if they uploaded a file

  // true if the message contains an @user mention (should also be true if the user is replying to someone)
  const hasMention = containsMention(msg)

  // User is posting a new track for feedback
  if (hasLink) {
    // TODO: user has dropped a link, make sure they have posted good feedback in the last 2 months
    // const channelId = msg.reference.channelID;
    // const joinDate = msg.member.joinedAt;
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(today.getMonth() - 2);


    const last100Messages = await msg.channel.fetch({limit: 100});


    const messageMap = last100Messages.messages.cache;
    let hasLeftGoodFeeback = false;
    for (let message of messageMap) {
      const messageContent = message[1].content;
      if (isGoodFeedback(messageContent)) {
        // user has left good feedback, let them post the link
        hasLeftGoodFeeback = true;
        return;
      } 
    }

    // user has not left good feedback
    msg.reply(`You haven't left good feedback in a while. Refer to #rules and the pinned messages
    in this channel for an example of what constitiutes good feedback. You can post a link once
    you leave good feedback.`);
    msg.delete()
    return;


  }

  if (hasMention) {
    const wordCount = msgContent.split(" ").length;
    if (wordCount < 10) {
      msg.reply(`You can do better! Make sure you leave some more thorough feedback if you want to post a link`);
      return;
    }
  //  else if (wordCount > 50) {
  //    // leave an emoji
  //    msg.reply(`Niceeeeee`)
  //   return;
  //   }
  }
});


/**
 * Check if the given string looks like a url
 * @param {String} text 
 * @returns {Boolean} true if the text is a url, false otherwise
 */
function containsUrl(text){
  const matchingText = text.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm);
  return (matchingText && matchingText.length > 0)
}


function containsMention(msg) {
  // this shouldn't happen, but don't do anything if there are no mentions in this message
  if (!msg || !msg.mentions) {
    return false;
  }
  
  if (msg.mentions.users.size === 1) {
    return true;
  }
  return false;
}


/**
 * Return true if the post was good feedback (more than 20 words), false otherwise
 * @param {String} message 
 */
function isGoodFeedback(message) {
  const wordCount = message.split(" ").length;

  return (wordCount >= 20);

}
