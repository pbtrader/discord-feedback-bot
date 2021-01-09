// require('dotenv').config();
const Discord = require('discord.js');
// const Enmap = require("enmap")
const { promisify } = require("util");

const readdir = promisify(require("fs").readdir);

const addModules = client => {

  client.logger = require("./util/Logger");
  require("./modules/functions.js")(client);

	require("./modules/feedback")(client);
};

// const addCommands = async client => {
// 	// Aliases and commands are put in collections where they can be read from,
// 	// catalogued, listed, etc.
// 	client.commands = new Enmap();
// 	client.aliases = new Enmap();

// 	// Here we load **commands** into memory, as a collection, so they're accessible
// 	// here and everywhere else.
// 	const cmdFiles = await readdir("./commands/");
// 	client.logger.log(`Loading a total of ${cmdFiles.length} commands.`);
// 	cmdFiles.forEach(f => {
// 		if (!f.endsWith(".js")) return;
// 		const response = client.loadCommand(f);
// 		if (response) console.log(response);
//   });
  
// }

// const addFilters = async client => {
// 	client.filters = new Enmap();

// 	// Subsequently, if not obviously, we load channel filters
// 	// Filters are stored with the channelNames as the key, this is important!
// 	// You must use help.name for the name.
// 	const fltrFiles = await readdir("./filters/");
// 	client.logger.log(`Loading a total of ${fltrFiles.length} Filters.`);
// 	fltrFiles.forEach(f => {
// 		if (!f.endsWith(".js")) return;
// 		const response = client.loadFilter(f);
// 		if (response) console.log(response);
// 	});
// };

const addEventListeners = async client => {
	// Then we load events, which will include our message and ready event.
	const evtFiles = await readdir("./events/");
	client.logger.log(`Loading a total of ${evtFiles.length} events.`);
	evtFiles.forEach(file => {
		const eventName = file.split(".")[0];
		const event = require(`./events/${file}`);
		// This line is awesome by the way. Just sayin'.
		client.on(eventName, event.bind(null, client));
		delete require.cache[require.resolve(`./events/${file}`)];
	});
};


const init = async () => {
	const client = new Discord.Client();

	// Load client (bot) config.
	//
	// client.config.token contains the bot's token
	// client.config.prefix contains the message prefix
	const configPath = process.env.CONFIG_PATH || "./config.js";
	client.config = require(configPath);

	// Check for required config and exit with error if missing.
	// if (!client.config.roleIds) {
	// 	console.error(new TypeError("Config files is missing `roleIds` property"));
	// 	process.exitCode = 1;
	// 	return;
	// }

	addModules(client);

	// Now we integrate the use of Evie's awesome Enhanced Map module, which
	// essentially saves a collection to disk. This is great for per-server configs,
	// and makes things extremely easy for this purpose.
	// client.settings = new Enmap({ name: "settings"});

	// await addCommands(client);
	// await addFilters(client);
	await addEventListeners(client);

	// addPermissions(client);

	// Log into Discord.
	client.login(client.config.token);
};

init()
