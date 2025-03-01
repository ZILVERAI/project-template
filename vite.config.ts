import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@routes": path.resolve(__dirname, "./src/routes"),
		},
	},
	plugins: [react()],
	server: {
		hmr: {
			path: "/_vite_websockets",
		},
		allowedHosts: [".zilver.com", ".zilver.local"],
	},
});
