import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function disableCachePlugin(): Plugin {
	return {
		name: "strip-if-none-match",
		handleHotUpdate({ server }) {
			server.ws.send({ type: "full-reload" });
			return [];
		},
		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				delete req.headers["if-none-match"];
				next();
			});
		},
	};
}

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			// "@components": path.resolve(__dirname, "./src/components"),
			// "@routes": path.resolve(__dirname, "./src/routes"),
			// "@utils": path.resolve(__dirname, "./src/utils"),
		},
	},
	plugins: [react(), disableCachePlugin()],
	server: {
		watch: {
			alwaysStat: true,
			usePolling: true,
		},
		hmr: {
			path: "/_vite_websockets",
		},
		allowedHosts: [".zilver.com", ".zilver.local"],
	},
});
