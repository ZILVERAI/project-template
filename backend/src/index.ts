import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
const port = 3000;

app.get("/", (req, res) => {
	res.send("Hello World!");
});

const server = app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});

async function stopServer() {
	server.close();
}

process.on("SIGTERM", stopServer);
process.on("SIGINT", stopServer);
