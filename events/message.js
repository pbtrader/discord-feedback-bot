const FEEDBACK_COMMAND = "$feedback";
const TRACK_COMMAND = "$track";
const SCORE_COMMAND = "$score";
const HELP_COMMAND = "$help";

const ALLOWED_CHANNELS = ["feedback", "bot-testing"]

module.exports = async (client, msg) => {
  let command;
  let leavingFeedback = false;
  let postingTrack = false;
  let checkingScore = false;
  let gettingHelp;

  let reply;

    // only works in the feedback channel or bot-testing channel
    if (!ALLOWED_CHANNELS.includes(msg.channel.name)) {
      return;
    } 
      // get message content and author
      const msgContent = msg.content;
      const authorId = msg.author.id

      // ignore bot messages
      if (msg.author.bot) {
        return;
      }

      // $feedback and $track commands must start with an exclamation, otherwise they will not be counted
      if (msgContent[0] === "$") {
        command = getCommand(msgContent)
      }

      switch(command) {
        case FEEDBACK_COMMAND: {
          leavingFeedback = true;
          break;
        }
        case TRACK_COMMAND: {
          postingTrack = true;
          break;
        }
        case SCORE_COMMAND: {
          checkingScore = true;
          break;
        }
        case HELP_COMMAND: {
          gettingHelp = true;
          break;
        }
        default: {
          // user is posting something that doesn't meet a valid command. Let them post it but it won't count
          break;
        }
      }
    
      // true if the message contains a URL
      const hasLink = containsUrl(msgContent);
      const hasAttachment = (msg.attachments && msg.attachments.size > 0)

      const hasTrackLinkOrAttachment = hasLink || hasAttachment;

    
      if (gettingHelp) {
        msg.reply(`Before asking for feedback, make sure you leave some!
        
          To leave feedback, type "$feedback here is some super helpful feedback". Be sure to be constructive and offer some concrete ideas for your fellow producers!

          Then, post a track with "$track http://soundcloud.com/your-track-id"

          You can check your score at any time by typing "$score"

          If you don't follow these instructions, your links will be deleted!
        
        `)

        return;
      }

      // lets see if we're checking scores
      if (checkingScore) {
        const last100Messages = await msg.channel.messages.fetch({limit: 100});
        const userMessages = last100Messages.filter(msg => msg.author.id === authorId && msg.deleted === false);
        const {feedbackCount, trackCount} = checkRecentMessages(userMessages, "score");

        msg.reply(`recent feedback count: ${feedbackCount}, recent track count: ${trackCount}`)
        return;
      }

      // if use is leaving feedback, make sure it is long enough and holler if it is not
      if (leavingFeedback) {
        const goodFeedback = isGoodFeedback(msgContent);
        if (!goodFeedback) {
          msg.reply(`Please leave some more contructive feedback! Refer to the examples pinned in this channel.`);
          msg.react("👎")
          return;
        } else {
          // they left sufficient feedback, so stick an emoji on there;
          msg.react("👍")
          return;
        }
      }

      // otherwise, make sure user posted their track correctly
      if (hasTrackLinkOrAttachment && !postingTrack) {
        reply = `Did you forget the $track command? Refer to the pinned messages or type "$help" for some more info.`;
        msg.delete();
        msg.reply(reply);
        return;
      } else if (postingTrack && !hasTrackLinkOrAttachment) {
        // user used the track command without a link
        reply = `Did you forget to include a link or file? Refer to the pinned messages or type "$help" for some more info.`;
        msg.delete();
        msg.reply(reply);
        return;
      } else if (postingTrack && hasTrackLinkOrAttachment) {
        // hooray, they did it correctly! Now let's make sure they've left enough good feedback recently.
    
        const last50Messages = await msg.channel.messages.fetch({limit: 50});
        const userMessages = last50Messages.filter(msg => msg.author.id === authorId && msg.deleted === false);
        const {feedbackCount, trackCount} = checkRecentMessages(userMessages, "track");

        if (feedbackCount > trackCount) {
          // user has left enough good feedback recently, return here and let them post the track;
          return
        } else {
          // user has not posted enough feedback, holler at them and delete their track
          reply = `Please post some more feedback before sharing a track. Your current score is Feedback: ${feedbackCount}, Tracks: ${trackCount}. Type "$help" for more info.`
          msg.reply(reply);
          msg.delete();
          return;
        }
      }
}

  
  /**
   * Check if the given string looks like a url
   * @param {String} text 
   * @returns {Boolean} true if the text is a url, false otherwise
   */
  function containsUrl(text){
    const matchingText = text.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm);
    return (matchingText && matchingText.length > 0)
  }
    
  /**
   * Return true if the post was good feedback (more than 20 words), false otherwise
   * @param {String} message 
   */
  function isGoodFeedback(message) {
    const wordCount = message.split(" ").length;
  
    return (wordCount >= 20);
  }


  function checkRecentMessages(messages, type) {
    let feedbackCount = 0;

    // if the user is checking their score, we can start the track count at 0.
    // if the user is posting a new track, start at -1 so we don't include their newly posted link in the counts
    // (otherwise they'll get yelled at even if they posted feedback already)
    let trackCount = (type === "track") ? -1 : 0

    for (let message of messages) {
      const messageContent = message[1].content;
      if (getCommand(messageContent) === FEEDBACK_COMMAND && isGoodFeedback(messageContent)) {
        // user has left good feedback, return here and let them post the link
        feedbackCount++;
      } else if (getCommand(messageContent) === TRACK_COMMAND) {
        trackCount++;
      }
    }

    return {feedbackCount, trackCount}
  }


  function getCommand(message) {
    return message.split(" ")[0];
  }