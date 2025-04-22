// NOTE: The process for the backend needs to be started in a special way because bun's watch doesn't
// on docker

import chokidar from "chokidar";

const backendWatcher = chokidar.watch("./backend/", {
	ignored: (path) => path.includes("node_modules"),
	alwaysStat: true,
	awaitWriteFinish: true,
	atomic: true,
});
async function startBackendProcess() {
	let backendProcess: Bun.Subprocess | null = null;
	const spawnOptions: Bun.SpawnOptions.OptionsObject & { cmd: string[] } = {
		cmd: [
			"bun",
			"run",
			"--filter",
			"@backend",
			"--elide-lines=60",
			"dev:server",
		],

		stdout: "inherit",
		stderr: "inherit",
	};

	backendProcess = Bun.spawn(spawnOptions);
	let timer: NodeJS.Timeout | null = null;
	backendProcess.unref();

	async function handler(evName: string) {
		if (backendProcess === null) {
			// console.log("Change ongoing");
			return;
		}
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}

		timer = setTimeout(async () => {
			// console.log("Change ", evName);
			// backendProcess.send("restart");
			const inst = backendProcess;
			backendProcess = null;
			inst.kill("SIGINT");
			timer = null;
			await inst.exited;
			// console.log("Waiting for change...");
			backendProcess = Bun.spawn(spawnOptions);
			backendProcess.unref();
		}, 400);
	}
	// Hook up the on change event listener
	backendWatcher
		.on("add", handler)
		.on("change", handler)
		.on("unlink", handler)
		.on("addDir", handler)
		.on("unlinkDir", handler);
}

async function run() {
	const frontendProcess = Bun.spawn({
		cmd: ["bun", "run", "--filter", "frontend", "dev"],
		stdout: "pipe",
		stderr: "pipe",
	});

	// console.log("Servers started.");

	await startBackendProcess();
	await frontendProcess.exited;
}

run();
