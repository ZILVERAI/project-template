// NOTE: The process for the backend needs to be started in a special way because bun's watch doesn't
// on docker

import chokidar from "chokidar";
// TODO: This needs to be moved to the container controller so that crashes and automatic restarts can be handled.
async function startPrismaStudio(): Promise<Bun.Subprocess> {
	const sp = Bun.spawn({
		cwd: "./backend",
		cmd: [
			"bunx",
			"prisma",
			"studio",
			"--port",
			"1337",
			"--hostname",
			"0.0.0.0",
			"--browser",
			"none",
		],
		stdout: "inherit",
		stderr: "inherit",
	});

	return sp;
}

async function generatePrisma() {
	let prismaStudioProcess: Bun.Subprocess | null = null;
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

async function reassignFrontendProcess() {
	if (processes.frontend) {
		const p = processes["frontend"];
		p.kill("SIGINT");
		await p.exited;
		console.log(`Frontend process exited.`);
		processes.frontend = undefined;
	}
	const frontendProcess = Bun.spawn({
		cmd: ["bun", "run", "--filter", "frontend", "dev"],
		stdout: "pipe",
		stderr: "pipe",
	});
	console.log("Frontend running on PID", frontendProcess.pid);

	processes["frontend"] = frontendProcess;
}

async function reassignBackendProcess() {
	if (processes.backend) {
		const p = processes["backend"];
		p.kill("SIGINT");
		await p.exited;
		console.log("Backend proccess exited.");
		processes.backend = undefined;
	}
	const backendProcess = Bun.spawn({
		cmd: ["bun", "run", "dev:server"],
		cwd: "./backend",

		stdout: "inherit",
		stderr: "inherit",
	});

	console.log("Backend running on PID", backendProcess.pid);
	processes["backend"] = backendProcess;
}

type GetProcessInfo = {
	type: ProcessType;
};

// First ever call so that the processes start.
await reassignBackendProcess();
await reassignFrontendProcess();

const s = Bun.serve({
	port: 7777,

	routes: {
		"/get-logs": async (request) => {
			return new Response("Not implemented", {
				status: 400,
			});
		},
		"/restart-process": async (request) => {
			const body = (await request.json()) as GetProcessInfo;
			if (body.type === "backend") {
				await reassignBackendProcess();
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
