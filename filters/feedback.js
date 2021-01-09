exports.run = async (client, message) => {};

// Filters can have channelNames as a single string or an array of strings.
// This applies the filter to all Names listed.
exports.help = {
	name: "Feedback",
	allowCategory: "All",
	//allowCommands: ["points", "recent"],
	channelNames: ["feedback"]
};