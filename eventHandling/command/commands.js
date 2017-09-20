const reddit = require("../../util/reddit.js");
const logUtil = require("../../util/logging.js");
const discordUtil = require("../../util/discordUtil.js");

var exec = require('child_process').exec;

var helpMessage = "```"; // The message displayed on the help message
helpMessage += "Miscallaneous Commands: ";
helpMessage += "\n1. ;;help - U wot m8?";
helpMessage += "\n2. ;;ping - Pong!";
helpMessage += "\n3. ;;oldman [whatever] - And old man tells you get off his lawn and take whatever with you.";
helpMessage += "\n4. ;;m [subreddit] - Gets a random picture from the specified subreddit. Will sort out nsfw content on sfw channels.";
helpMessage += "\n5. ;;humourme - Gets a random picture from r/I_irl";
helpMessage += "\n6. ;;meow - Gets a random picture from r/cats";
helpMessage += "\n7. ;;github - Gives a link to the bot's source.";
helpMessage += "\n8. ;;link - Gives a link so you can add this bot to your server!";
helpMessage += "\n9. ;;genisland - Not \"genis-land\". It's \"gen-island\" Generates 1000x1000 island.";
helpMessage += "\n10. ;;noice - *POP* Noice!";

helpMessage += "\n\nMusic Commands: ";
helpMessage += "\n11. ;;play [url/id/search term] - Adds a youtube video to the queue.";
helpMessage += "\n12. ;;playlist [url/id/search term] - Queue a playlist.";
helpMessage += "\n13. ;;earrape [url/id/search term] - Adds a youtube video to the queue but it's better.";
helpMessage += "\n14. ;;madness [time] [url/id/search term] - Adds a youtube video to the queue and makes it better after the specified time in seconds.";
helpMessage += "\n15. ;;nightcore [url/id/search term] - Adds a youtube video to the queue but it's even better.";
helpMessage += "\n16. ;;hospital [url/id/search term] - Adds a youtube video to the queue but it's better and even better.";
helpMessage += "\n17. ;;drift - GAS GAS GAS!";
helpMessage += "\n18. ;;woah - WOAH!";
helpMessage += "\n19. ;;queue - Lists the current queue.";
helpMessage += "\n20. ;;np - Shows info on the current song.";
helpMessage += "\n21. ;;skip - Skips the current song.";
helpMessage += "\n22. ;;dc - Disconnects the bot from the voice channel. Can only be run by members with the \"Manage Channel\" permission.";

helpMessage += "\n\nPrefix Commands: (Can only be run by administrators)";
helpMessage += "\n23. ;;changeprefix [prefix] - Changes the command prefix.";
helpMessage += "\n24. ;;resetprefix - Resets the prefix to two semicolons.";

helpMessage += "\n\nWelcome Message Commands: (Can only be run by administrators)";
helpMessage += "\n25. ;;setjoinmessage [message] - Sets the welcome message of the guild. Wherever you want the new member's name to be in the message, put '{{name}}'.";
helpMessage += "\n26. ;;removejoinmessage - Removes the join message.";

helpMessage += "```";

// Message = message object that initiated command
// Params = The parameters of the command
// Globals = The global variables for the server that the command was initiated in
var commands = {
  ";;help" : function(message, params, globals) {
    discordUtil.getDMChannel(message.author, function(dmChannel) {
      if (!dmChannel) {
        message.reply("Something went wrong with trying to DM you.");
      } else {
        message.reply("Look at your DMs.");

        var customPrefix = globals.get("prefix");
        if (customPrefix && customPrefix != ";;") {
          dmChannel.send(helpMessage.replace(/;;/g, customPrefix)); // Display help message with the custom prefix. /;;/g makes it replace all occurances of ;;
        } else {
          dmChannel.send(helpMessage); // Display help message normally
        }
      }
    });
  },
  ";;ping" : function(message, params, globals) {
    message.channel.send("Pong!");
  },
  ";;oldman" : function(message, params, globals) { // To test parameters
    if (!params[0]) {
      message.channel.send("What did you say? Say something afterwards for a change!");
    } else {
      message.channel.send("Get off my lawn! And take your " + params.join(" ") + " with you!");
    }
  },
  ";;humourme" : function(message, params, globals) {
    reddit.getRandomUrl("i_irl", discordUtil.isChannelNSFW(message.channel), function(url) {
      if (url) {
        message.channel.send(url);
      } else {
        message.channel.send("There was an error reaching /r/I_Irl. Blame Finland.");
      }
    });
  },
  ";;meow" : function(message, params, globals) {
    reddit.getRandomUrl("cats", discordUtil.isChannelNSFW(message.channel), function(url) {
      if (url) {
        message.channel.send(url);
      } else {
        message.channel.send("There was an error reaching /r/cats. Blame Finland.");
      }
    });
  },
  ";;m" : function(message, params, globals) {
    if (params[0]) {
      reddit.getRandomUrl(params[0], discordUtil.isChannelNSFW(message.channel), function(url) {
        if (url) {
          message.channel.send(url);
        } else {
          message.channel.send("There was an error reaching /r/" + params[0] + " or the subreddit was nsfw and this isn't an nsfw channel you perv.");
        }
      });
    } else {
      message.channel.send("Give me the subreddit name damnit!");
    }
  },
  ";;github" : function(message, params, globals) {
    message.channel.send("https://github.com/tjpc3/NiceTMDiscordBot");
  },
  ";;genisland" : function(message, params, globals) {
    message.channel.send("One island coming up!");
    var child = exec('java -jar ./jars/genisland.jar',
      function (error, stdout, stderr) {
        if(error !== null){
          console.log("Error running Jar file: " + error);
          message.channel.send("Error: Shit hit the fan.");
          return;
        }

        message.channel.send("", {files: ["map.jpg"]});
    });
  },
  ";;test" : function(message, params, globals) {
    if (message.author.id != 150699865997836288) { // My id
      message.reply("Only the Robot Overlord is permitted to run this command.");
    } else {
      if (params[0] == "dc") {
        if (message.guild.voiceConnection != null) {
          message.guild.voiceConnection.disconnect();
        }
        return;
      }
    }
  },
  ";;count" : function(message, params, globals) {
    var count = globals.get("count");
    if (count == undefined) {
      globals.set("count", 0);
      count = 0;
    } else {
      globals.set("count", count + 1);
      count++;
    }

    message.channel.send("Current count for this server is " + count);
  },
  ";;link" : function(message, params, globals) {
    message.channel.send("Here's the link: https://discordapp.com/oauth2/authorize?client_id=318558676241874945&scope=bot&permissions=8192 \nAdd me to your server whydontcha?");
  }
}

module.exports.searchFunction = function(command) {
  return commands[command.toLowerCase()];
}

module.exports.close = function(globals, guild) {

}
