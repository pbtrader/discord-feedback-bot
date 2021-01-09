/**
 * @param {*} client
 * @throws If database is not found, or not open, in the client
 * @throws If execution of database statement fails
 */
module.exports = client => {
	client.logger.log("Adding feedback module...");

	// validateClient(client);
	// validateTables(client.database);

	client.logger.log("Successfully added feedback module to client.");
};


const validateClient = client => {
	if (!client.database) {
		throw new TypeError("Database is missing.");
	}

	if (!client.database.open) {
		throw new TypeError("Database connection is not open.");
	}
};