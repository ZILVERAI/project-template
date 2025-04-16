const server = Bun.serve({
	port: 3000,
	fetch(request) {
		// Only used for start-server-and-test package that
		// expects a 200 OK to start testing the server.
		if (request.method === "HEAD") {
			return new Response();
		}

		return new Response("hello world");
	},
});

async function stopServer() {
	await server.stop();
}

process.on("SIGTERM", stopServer);
process.on("SIGINT", stopServer);
console.log("Listening on 3000");
