// NOTE: The process for the backend needs to be started in a special way because bun's watch doesn't
// on docker

import chokidar from "chokidar";

const backendWatcher = chokidar.watch("./backend/", {
	ignored: (path) => path.includes("node_modules"),
});
async function startBackendProcess() {
	const spawnOptions: Bun.SpawnOptions.OptionsObject & { cmd: string[] } = {
		cmd: ["bun", "run", "--filter", "backend", "dev:server"],
		stdout: "inherit",
	};
	let backendProcess: Bun.Subprocess | null = Bun.spawn(spawnOptions);

	async function handler(evName: string) {
		console.log("Change ", evName);
		if (backendProcess === null) {
			return;
		}

		const inst = backendProcess;
		backendProcess = null;
		inst.kill();

		if (await inst.exited) {
			console.log("Restarting backend");
			backendProcess = Bun.spawn(spawnOptions);
		}
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
		stdout: "inherit",
		stderr: "pipe",
	});

	console.log("Servers started.");

	await startBackendProcess();
	await frontendProcess.exited;
}

run();
