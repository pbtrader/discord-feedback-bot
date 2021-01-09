module.exports = client => {
	/*
  PERMISSION LEVEL FUNCTION

  This is a very basic permission system for commands which uses "levels"
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
  command including the VERY DANGEROUS `eval` and `exec` commands!

  */
	client.permlevel = message => {
		let permlvl = 0;

		const permOrder = client.config.permLevels.slice(0).sort((p, c) => (p.level < c.level ? 1 : -1));

		while (permOrder.length) {
			const currentLevel = permOrder.shift();
			if (message.guild && currentLevel.guildOnly) continue;
			if (currentLevel.check(message)) {
				permlvl = currentLevel.level;
				break;
			}
		}
		return permlvl;
	};

	/*
  SINGLE-LINE AWAITMESSAGE

  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...

  USAGE

  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);

  */
	client.awaitReply = async (msg, question, limit = 60000) => {
		const filter = m => (m.author.id = msg.author.id);
		await msg.channel.send(question);
		try {
			const collected = await msg.channel.awaitMessages(filter, { max: 1, time: limit, errors: ["time"] });
			return collected.first().content;
		} catch (e) {
			return false;
		}
	};

	/*
  MESSAGE CLEAN FUNCTION

  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
	client.clean = async (client, text) => {
		if (text && text.constructor.name == "Promise") text = await text;
		if (typeof evaled !== "string") text = require("util").inspect(text, { depth: 0 });

		text = text
			.replace(/`/g, "`" + String.fromCharCode(8203))
			.replace(/@/g, "@" + String.fromCharCode(8203))
			.replace(client.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");

		return text;
	};

	client.loadCommand = commandName => {
		try {
			const props = require(`../commands/${commandName}`);
			if (props.init) {
				props.init(client);
			}
			client.logger.log(`Loading Command: ${props.help.name}. 👌`);
			client.commands.set(props.help.name.toLowerCase(), props);
			props.conf.aliases.forEach(alias => {
				client.aliases.set(alias, props.help.name);
			});
			return false;
		} catch (e) {
			return `Unable to load command ${commandName}: ${e}`;
		}
	};

	// load channel filters
	client.loadFilter = filterName => {
		try {
			const props = require(`../filters/${filterName}`);
			client.logger.log(`Loading Filter: ${props.help.name}. 👌`);
			// Leaving init here. Unsure if it'd be necessary, but why not?
			if (props.init) {
				props.init(client);
			}
			// Support arrays of channel IDs incase the filter applies to multiple channels.
			if (props.help.channelNames.constructor === Array) {
				for (let i of props.help.channelNames) {
					client.filters.set(i, props);
				}
			} else {
				client.filters.set(props.help.channelNames, props);
			}
			return false;
		} catch (e) {
			return `Unable to load command ${filterName}: ${e}`;
		}
	};
	client.unloadFilter = async filterName => {
		const filterKey = filterName.toLowerCase();
		let filter;
		for ([k, v] of client.filters) {
			if (v.help.name.toLowerCase() === filterKey) {
				filter = client.filters.get(k);
				break;
			}
		}
		if (!filter) return `The filter \`${filterName}\` doesn"t seem to exist. Try again!`;
		if (filter.shutdown) {
			await filter.shutdown(client);
		}
		delete require.cache[require.resolve(`../filters/${filterName}.js`)];
		return false;
	};
	client.unloadCommand = async commandName => {
		const commandKey = commandName.toLowerCase();
		let command;
		if (client.commands.has(commandKey)) {
			command = client.commands.get(commandKey);
		} else if (client.aliases.has(commandKey)) {
			command = client.commands.get(client.aliases.get(commandKey));
		}
		if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;
		if (command.shutdown) {
			await command.shutdown(client);
		}
		delete require.cache[require.resolve(`../commands/${commandName}.js`)];
		return false;
	}; /* MISCELANEOUS NON-CRITICAL FUNCTIONS */ // EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this // later, this conflicts with native code. Also, if some other lib you use does // this, a conflict also occurs. KNOWING THIS however, the following 2 methods // are, we feel, very useful in code. // <String>.toPropercase() returns a proper-cased string such as: // "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
	String.prototype.toProperCase = function() {
		return this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}; // <Array>.random() returns a single random element from an array // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
	Array.prototype.random = function() {
		return this[Math.floor(Math.random() * this.length)];
	}; // `await client.wait(1000);` to "pause" for 1 second.
	client.wait = require("util").promisify(setTimeout); // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
	process.on("uncaughtException", err => {
		const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
		client.logger.error(`Uncaught Exception: ${errorMsg}`);
		// Always best practice to let the code crash on uncaught exceptions.
		// Because you should be catching them anyway.
		process.exit(1);
	});
	process.on("unhandledRejection", err => {
		client.logger.error(`Unhandled rejection: ${err}`);
	});
	client.statusCodeVerify = (url, f) => {
		let link = require("url").parse(url);
		let options = {
			host: link.hostname,
			path: link.path,
			port: link.port,
			headers: { "User-Agent": "EDMPbot/1.0" }
		};
		const httpReq = url.startsWith("https") ? require("https") : require("http");
		let req = httpReq.request(options, res => {
			client.logger.log(`Status code: ${res.statusCode}, Message: ${res.statusMessage}`);
			f(res.statusCode);
		});
		req.on("error", e => {
			client.logger.error(e);
			f(0);
		});
		req.end();
		client.logger.log("end of gscfu");
	}; // Checks to see if the test string is the first string in input.// Works on strings or arrays// Returns the index of where the match was found in the array// or returns true of the string contains the value
	client.matchFirstString = (input, test) => {
		if (typeof test == "object") return fArray(input, test);
		else if (typeof test == "string") fString(input, test);
	};
};
const fArray = (input, test) => {
	for (var i = 0; i < test.length; i++) {
		if (fString(input, test[i])) return i;
	}
	return false;
};
const fString = (input, test) => {
	for (var j = 0; j < test.length; j++) {
		// This compares the test strings to the input character by character.
		// string.indexOf() parses the entire string if it's a 'miss', no good!
		// This method breaks on the first miss, or at the test's length
		// the full string is _never_ parsed.
		if (input.charAt(j) !== test.charAt(j)) {
			break;
		}
		if (j === test.length - 1) {
			return true;
		}
	}
	return false;
};