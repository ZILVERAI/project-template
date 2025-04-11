async function run() {
	const frontendProcess = Bun.spawn({
		cmd: ["bun", "run", "--filter", "frontend", "dev"],
		stdout: "inherit",
		stderr: "pipe",
	});
	const backendProcess = Bun.spawn({
		cmd: ["bun", "run", "--filter", "backend", "dev:server"],
		stdout: "inherit",
		// stderr: "pipe",
	});

	console.log("Servers started.");

	await frontendProcess.exited;
	await backendProcess.exited;
}

run();
