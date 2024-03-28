const { MongoClient } = require('mongodb');
const chalk = require('chalk');

const mongoURI = "mongodb+srv://bhimchauhan262:kumar123bheem@cluster0.y7erbrr.mongodb.net/cars?retryWrites=true&w=majority" // "mongodb://localhost:27017/cars";

async function connectToDatabase() {
    try {
        const client = new MongoClient(mongoURI, {}); //  { useNewUrlParser: true, useUnifiedTopology: true}
        await client.connect();
        console.log(chalk.bgMagenta.white(" Connected to the MongoDB database successfully. "));
        return client.db();
    } catch (error) {
        console.error(chalk.bgRed.white(`Error connecting to the database: ${error}`));
        throw error;
    }
}
module.exports = connectToDatabase;
