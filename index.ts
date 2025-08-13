// NOTE: The process for the backend needs to be started in a special way because bun's watch doesn't
// on docker

import chokidar from "chokidar";
import { createPrismaPostgresHttpClient } from "@prisma/studio-core/data/ppg";
import { Query } from "@prisma/studio-core/data";
import { serializeError } from "@prisma/studio-core/data/bff";

// TODO: This needs to be moved to the container controller so that crashes and automatic restarts can be handled.
async function startDrizzleStudio(): Promise<Bun.Subprocess> {
	const sp = Bun.spawn({
		cwd: "./backend",
		cmd: [
			"bunx",
			"drizzle-kit",
			"studio",
			"--host",
			"0.0.0.0",
			"--port",
			"1337",
		],
		stdout: "inherit",
		stderr: "inherit",
	});

	return sp;
}

async function generatePrisma() {
	// let prismaStudioProcess: Bun.Subprocess | null = null;
	const sp = Bun.spawn({
		cwd: "./backend",
		cmd: ["bunx", "prisma", "migrate", "deploy"],
		stdout: "inherit",
		stderr: "inherit",
	});

	await sp.exited;

	const gen = Bun.spawn({
		cwd: "./backend",
		cmd: ["bunx", "prisma", "generate"],
		stdout: "inherit",
		stderr: "inherit",
	});

	await gen.exited;

	// if (prismaStudioProcess === null) {
	// 	prismaStudioProcess = await startPrismaStudio();
	// } else {
	// 	(prismaStudioProcess as Bun.Subprocess).kill("SIGINT");
	// 	await (prismaStudioProcess as Bun.Subprocess).exited;
	// 	console.log("Prisma studio killed");
	// 	prismaStudioProcess = await startPrismaStudio();
	// }
}
type ProcessType = "frontend" | "backend";
const processes: {
	[p in ProcessType]:
		| Bun.Subprocess<"ignore", "pipe" | "inherit", "pipe" | "inherit">
		| undefined;
} = {
	backend: undefined,
	frontend: undefined,
};

let prismaStudioProcess: Bun.Subprocess | null = null;

// Log buffers to handle multiple connections
const logBuffers: {
	[p in ProcessType]: string[];
} = {
	backend: [],
	frontend: [],
};

// Active log streams
const activeLogStreams: {
	[p in ProcessType]: Set<ReadableStreamDefaultController>;
} = {
	backend: new Set(),
	frontend: new Set(),
};

async function reassignFrontendProcess() {
	if (processes.frontend) {
		const p = processes["frontend"];
		p.kill("SIGKILL");
		console.log("Waiting for frontend process to die..");
		await p.exited;
		console.log(`Frontend process exited.`);
		processes.frontend = undefined;
	}
	const frontendProcess = Bun.spawn({
		cmd: ["bun", "run", "dev"],
		cwd: "./frontend",
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			FORCE_COLOR: "1",
			COLORTERM: "truecolor",
		},
	});
	console.log("Frontend running on PID", frontendProcess.pid);

	processes["frontend"] = frontendProcess;

	// Clear old logs and start capturing new ones
	logBuffers.frontend = [];
	setupLogCapture("frontend", frontendProcess);
}

async function reassignBackendProcess(enviroment: Record<string, string>) {
	if (processes.backend) {
		const p = processes["backend"];
		p.kill();
		await p.exited;
		console.log("Backend proccess exited.");
		processes.backend = undefined;
	}
	const backendProcess = Bun.spawn({
		cmd: ["bun", "run", "dev:server"],
		cwd: "./backend",
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			...enviroment,
			FORCE_COLOR: "1",
			COLORTERM: "truecolor",
		},
	});

	console.log("Backend running on PID", backendProcess.pid);
	processes["backend"] = backendProcess;

	// Clear old logs and start capturing new ones
	logBuffers.backend = [];
	setupLogCapture("backend", backendProcess);
}

async function setupLogCapture(
	processType: ProcessType,
	process: Bun.Subprocess,
) {
	console.log(`Setting up log capture for ${processType}`);
	const decoder = new TextDecoder();

	const captureStream = async (
		reader: ReadableStreamDefaultReader<Uint8Array>,
	) => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const text = decoder.decode(value);
				console.log(`[${processType}] Captured: ${text.substring(0, 100)}...`);
				logBuffers[processType].push(text);

				// Broadcast to all active streams
				activeLogStreams[processType].forEach((controller) => {
					try {
						controller.enqueue(`data: ${text}\n\n`);
					} catch (error) {
						// Remove broken controllers
						console.log("Error sending bytes", error);
						activeLogStreams[processType].delete(controller);
					}
				});
			}
		} catch (error) {
			console.log(`Log capture error for ${processType}:`, error);
		}
	};

	// Capture both stdout and stderr
	const stdoutReader = process.stdout.getReader();
	const stderrReader = process.stderr.getReader();

	Promise.all([captureStream(stdoutReader), captureStream(stderrReader)]).then(
		() => {
			// Close all active streams when process ends
			activeLogStreams[processType].forEach((controller) => {
				try {
					controller.close();
				} catch (error) {
					// Controller might already be closed
				}
			});
			activeLogStreams[processType].clear();
		},
	);
}

type GetProcessInfo = {
	type: ProcessType;
	envVars: Record<string, string>;
};

// First ever call so that the processes start.
// prismaStudioProcess = await startPrismaStudio();
await reassignBackendProcess({}); // Initially without env variables because later will be collected from restart process.
await reassignFrontendProcess();

const s = Bun.serve({
	port: 7777,
	idleTimeout: 60,
	routes: {
		"/studio": async (request) => {
			const { query } = (await request.json()) as { query: Query };
			if (!process.env.DATABASE_URL) {
				return new Response("Not available", {
					status: 404,
				});
			}
			const client = createPrismaPostgresHttpClient({
				url: process.env.DATABASE_URL,
			}); // TODO: Maybe no need to re-create it every time?
			const [error, results] = await client.execute(query);
			if (error) {
				return Response.json([serializeError(error)]);
			}

			return Response.json([null, results]);
		},
		"/health": async () => {
			return new Response("Ok", {
				status: 200,
			});
		},
		"/get-logs": async (request) => {
			const processType = new URL(request.url).searchParams.get("type");
			if (!processType) {
				console.error("Missing type");
				return new Response("missing type", {
					status: 404,
				});
			}
			const process = processes[processType];

			if (!process) {
				return new Response("Process not found", {
					status: 404,
				});
			}

			let streamController: ReadableStreamDefaultController;
			let timer: Timer; // Used to avoid the connection from dropping.

			const stream = new ReadableStream({
				start(controller) {
					streamController = controller;

					// Send existing logs first
					logBuffers[processType].forEach((log) => {
						// console.log("Enqueing", log);
						try {
							controller.enqueue(`data: ${log}\n\n`);
						} catch {
							console.error(
								"Attempted to enqueue data but the controller was already closed",
							);
						}
					});
					timer = setInterval(() => {
						try {
							controller.enqueue(`: keepalive\n\n`);
						} catch {
							console.error(
								"Keepalive signal wasn't sent because the controller was already closed.",
							);
							clearInterval(timer);
						}
					}, 5000);

					// Add this controller to active streams for future logs
					activeLogStreams[processType].add(controller);
				},
				cancel() {
					clearInterval(timer);
					// Remove controller when stream is cancelled
					if (streamController) {
						activeLogStreams[processType].delete(streamController);
					}
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
				},
			});
		},
		"/restart-process": async (request) => {
			const body = (await request.json()) as GetProcessInfo;
			if (body.type === "backend") {
				await reassignBackendProcess(body.envVars);
			} else if (body.type === "frontend") {
				await reassignFrontendProcess();
			} else {
				return new Response("invalid type", {
					status: 404,
				});
			}

			console.log(`Process ${body.type} restarted successfully`);

			return new Response(null, {
				status: 200,
			});
		},
	},
});

const stopServer = async () => {
	await s.stop();

	// On exit, kill both backend and frontend processes too..
	console.log("Server killed, killing processes...");
	if (processes.backend) {
		processes.backend.kill("SIGINT");
		await processes.backend.exited;
	}

	if (processes.frontend) {
		processes.frontend.kill("SIGINT");
		await processes.frontend.exited;
	}

	console.log("All processes have been killed.");
};

process.on("SIGTERM", stopServer);
process.on("SIGINT", stopServer);

console.log("Server running...");
