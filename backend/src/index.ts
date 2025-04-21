import express from "express";
import cors from "cors";
import http from "node:http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const port = 3000;

// Express API

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
app.use("/_api", apiRouter);

apiRouter.get("/", (req, res) => {
	res.send("Hello World!");
});

// SocketIO
const io = new Server(server, {
	path: "/_api/socket.io",
});

io.on("connection", (socket) => {
	console.log("New connection received!");
});

// Start sever + some utilities.

server.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});

async function stopServer() {
	server.close();
}

process.on("SIGTERM", stopServer);
process.on("SIGINT", stopServer);
