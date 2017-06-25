const discordUtil = require("../../util/discordUtil.js");
const youtubeUtil = require("../../util/youtube.js");
const logUtil = require("../../util/logging.js");

const moment = require("moment");

module.exports = {};

var songQueue = []; // Stores songs

var commands = {
  "!play" : function(message, params, globals) {
    thePlayCommand(message, params, globals, 1);
  },
  "!earrape" : function(message, params, globals) {
    thePlayCommand(message, params, globals, 2);
  },
  "!nightcore" : function(message, params, globals) {
    thePlayCommand(message, params, globals, 3);
  },
  "!skip" : function(message, params, globals) {
    globals.set("timeOfEnd", -1); // Make the music bot stop playing
    try {
      message.guild.voiceConnection.playFile('non existant mp3.mp3'); // This stops what the bot is playing so it will try to play this mp3
    } catch (exception) {
      // The mp3 doesn't exist so this line will always error
    }
  },
  "!queue" : function(message, params, globals) {
    var dmChannel = message.author.dmChannel;
    if (!dmChannel) {
      message.author.createDM().then(function (dmChannel) { // Make the dm channel if one doesn't exist
        message.reply("Look at your DMs.");
        var musicQueue = globals.get("musicQueue");
        listQueue(dmChannel, musicQueue);
      }).catch(function (exception) {
        message.reply("Something went wrong with trying to DM you.");
      });
      return;
    }

    message.reply("Look at your DMs.");
    var musicQueue = globals.get("musicQueue");
    listQueue(dmChannel, musicQueue);
  }
}

function listQueue(dmChannel, musicQueue) { // Used in the "!queue" command
  if (!musicQueue) {
    dmChannel.send("There is no music queued");
    return;
  }
  if (musicQueue.length == 0) {
    dmChannel.send("There is no music queued");
    return;
  }

  var messageToSend = "```Current queue: ";
  for (var i in musicQueue) { // Iterate through the queue
    var iPlusOne = parseInt(i) + 1; // parseInt because reasons
    messageToSend += "\n" + (iPlusOne + ". " + musicQueue[i].title + " queued by " + musicQueue[i].user + ".");
  }
  messageToSend += "```";

  dmChannel.send(messageToSend);
}

function addToMusicQueue(data, message, globals, channel, type) { // Used in the "!play" command
  channel.join().then(function(connection) {
    message.channel.guild.fetchMember(message.author).then(function(member) { // So we can get the nickname instead of the username
      var musicQueue = globals.get("musicQueue"); // Get queue

      if (member.nickname == null) { // The nickname is null sometimes
        musicQueue.push({"id" : data.id, "user" : message.author.username, "title" : data.snippet.title, "type" : type}); // Add music to queue
        message.channel.send("`" + message.author.username + "` added `" + data.snippet.title + "` to the queue.");
      } else {
        musicQueue.push({"id" : data.id, "user" : member.nickname, "title" : data.snippet.title, "type" : type}); // Add music to queue
        message.channel.send("`" + member.nickname + "` added `" + data.snippet.title + "` to the queue.");
      }

      globals.set("musicQueue", musicQueue); // Set queue

      if (message.deletable) {
        message.delete(); // So the music channel isn't filled with youtube videos
      }
    });
  }).catch(function(err) { // Catch error
    logUtil.log("Error trying to join voiceChannel.", logUtil.STATUS_ERROR);
    console.log(err);
  });
}

function thePlayCommand (message, params, globals, type) { // Is the play command
  if (params[0] != undefined) {
    var channel;
    if (message.guild.voiceConnection) {
      channel = message.guild.voiceConnection.channel;
    } else {
      channel = discordUtil.findVoiceChannel(message.author, message.guild);
      if (channel == null) {
        message.channel.send("Please join a voice channel.");
        return;
      }
    }
    var id = youtubeUtil.getIdFromUrl(params[0]); // Get Id
    if (id == null) {
      youtubeUtil.getVideoDataFromSearchQuery(params.join(" "), "snippet", function(data) { // Iterperet the parameters as a search term
        if (!data) {
          message.channel.send("Invalid search query.");
        } else {
          data.id = data.id.videoId; // Because data is formatted differently for getVideoDataFromId than getVideoDataFromSearchQuery for some reason
          addToMusicQueue(data, message, globals, channel, type);
        }
      });
    } else {
      youtubeUtil.getVideoDataFromId(id, "snippet", function(data) {
        if (!data) {
          message.channel.send("Invalid youtube link or id.");
        } else {
          addToMusicQueue(data, message, globals, channel, type);
        }
      });
    }
  } else {
    message.channel.send("Please provide the youtube video url or a search term.");
  }
}

module.exports.searchFunction = function(command) {
  return commands[command.toLowerCase()];
}

module.exports.loop = function(globals, guild) {
  var timeOfEnd = globals.get("timeOfEnd");

  if (!timeOfEnd) {
    timeOfEnd = -1;
  }

  if (timeOfEnd == -1) { // No song is playing
    var musicQueue = globals.get("musicQueue");
  //  console.log("Queue:" + musicQueue + " Server: " + guild.name);
    if (!musicQueue) {
      musicQueue = [];
    }

    if (musicQueue.length != 0) { // If there are songs queued
      var temp = musicQueue.shift(); // Get the song
      var id = temp.id; // Get the id
      var type = temp.type; // He He he
      globals.set("musicQueue", musicQueue); // Set musicQueue

      youtubeUtil.getVideoDataFromId(id, "contentDetails", function(data) {
        if (!data) {
          //message.channel.send("There was a problem getting the data for youtube video https://youtube.com/watch?v=" + id); // Say there was an error and display the video
        } else {
          if (!guild.voiceConnection) {
            musicQueue = []; // Bot isn't connected to a voiceChannel so clear the queue
          } else {
            switch (type) {
              case 1:
                var result = discordUtil.playYoutubeVideo(guild.voiceConnection, id); // Play the video normally
                break;
              case 2:
                var result = discordUtil.playYoutubeVideoLOUD(guild.voiceConnection, id); // Play the video better
                break;
              default:
                var result = discordUtil.playYoutubeVideoFAST(guild.voiceConnection, id); // Play the video even better
            }

            if (result != true) {
              //message.channel.send("There was an error trying to play youtube video https://youtube.com/watch?v=" + id); // Say there was an error and display the video
            } else {
              var durationOfSong = moment.duration(data.contentDetails.duration).asMilliseconds();
              if (type == 3) {
                durationOfSong /= 1.4; // Because even better is faster
              }

              timeOfEnd = durationOfSong + moment().valueOf(); // Calculate the UNIX timestamp when the video will end
              globals.set("timeOfEnd", timeOfEnd);
            }
          }
        }
      });
    }

    globals.set("musicQueue", musicQueue);
  } else { // Song is playing
    if (moment().valueOf() > timeOfEnd) { // The video has ended
      timeOfEnd = -1; // Play the next video on the next playthrough
    }
  }

  globals.set("timeOfEnd", timeOfEnd);

  return globals; // Pass the updated globals list back
}

module.exports.close = function(globals, guild) { // Runs on close
  globals.set("timeOfEnd", -1); // So the bot won't wait while playing nothing
}
