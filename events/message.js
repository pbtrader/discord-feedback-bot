const FEEDBACK_COMMAND = "$feedback";
const TRACK_COMMAND = "$track";

module.exports = async (client, msg) => {
  let command;
  let leavingFeedback = false;
  let postingTrack = false;

  let reply;

    // only works in the feedback channel
    if (msg.channel.name !== "feedback") {
        return;
      }
      
      // get message content and author
      const msgContent = msg.content;
      const authorId = msg.author.id

      // ignore bot messages
      if (msg.author.bot) {
        return;
      }

      // !feedback and !track commands must start with an exclamation, otherwise they will not be counted
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
        default: {
          // user is posting something that doesn't meet a valid command. Let them post it but it won't count
          break;
        }
      }
    
      // true if the message contains a URL
      const hasLink = containsUrl(msgContent);
      const hasAttachment = (msg.attachments && msg.attachments.size > 0)

    
      // User is posting a new track for feedback
      if (hasLink || hasAttachment) {
        if (!postingTrack) {
          // exit and holler if the user didn't use the $track command
          reply = "Did you forget the $track command? Please refer to the rules for posting tracks";
          msg.reply(reply);
          msg.delete();
          return;
        }

        // otherwise user correctly used the track command. Make sure they have posted sufficient feedback in the
        // past 100 messages
    
        const last100Messages = await msg.channel.messages.fetch({limit: 100});
        const userMessages = last100Messages.filter(msg => msg.author.id === authorId && msg.deleted === false);
        const {feedbackCount, trackCount} = checkRecentMessages(userMessages);

        if (feedbackCount > trackCount) {
          // user has left enough good feedback recently, return here and let them post the track;
          return
        } else {
          // user has not posted enough feedback, holler at them and delete their track
          reply = `You have posted ${trackCount} tracks and ${feedbackCount} pieces of good feedback recently. Leave more feedback before posting a track. Refer to #rules and the pinned messages in this channel for an example of what constitiutes good feedback.`
          msg.reply(reply);
          msg.delete();
          return;
        }  
    
      }

      // user is not posting a track, check if they are posting feedback

      if (leavingFeedback) {
        const goodFeedback = isGoodFeedback(msgContent);
        if (!goodFeedback) {
          msg.reply(`Please leave some more contructive feedback! Refer to the #rules channel and examples pinned in this channel`);
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

  function checkRecentMessages(messages) {
    let feedbackCount = 0;
    let trackCount = 0;

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