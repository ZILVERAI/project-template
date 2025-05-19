import { defineConfig, Plugin, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { parse, ParserOptions } from "@babel/parser";
import _traverse from "@babel/traverse";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

import MagicString from "magic-string";
// import { walk } from "estree-walker";

import { JSXIdentifier, JSXMemberExpression } from "@babel/types";

const taggableExtensions = new Set([".jsx", ".tsx"]);

function tagPlugin(): Plugin {
	const cwd = process.cwd();

	return {
		name: "zilver-comp-tag",
		enforce: "pre",
		async transform(code, id) {
			// Ignore the files that are not taggable or that exist in node modules
			if (!taggableExtensions.has(path.extname(id))) {
				return null;
			}

			if (id.includes("node_modules")) {
				return null;
			}

			const relativePath = path.relative(cwd, id);

			try {
				const parseConfig: ParserOptions = {
					sourceType: "module",
					plugins: ["jsx", "typescript"],
				};

				const abstracttree = parse(code, parseConfig);

				const magicString = new MagicString(code);
				let traverse: typeof _traverse;

				if (typeof _traverse === "function") {
					traverse = _traverse;
				} else {
					//@ts-expect-error Lib is bugged
					traverse = _traverse.default;
				}

				// console.log(typeof traverse);

				traverse(abstracttree, {
					enter(nodePath) {
						// if (nodePath.node.type === "JSXElement") {
						// 	console.log(nodePath.node.nam);
						// }

						if (nodePath.node.type === "JSXOpeningElement") {
							const jsxNode = nodePath.node;
							let elName: string | undefined;

							if (jsxNode.name.type === "JSXIdentifier") {
								elName = jsxNode.name.name;
								// console.log("Name", elName);
							} else if (jsxNode.name.type === "JSXMemberExpression") {
								const expression: JSXMemberExpression = jsxNode.name;
								const expressionObject: JSXIdentifier = jsxNode.name
									.object as JSXIdentifier;

								elName = `${expressionObject.name}.${expression.property.name}`;
							} else {
								return;
							}

							// Ignore name-less components
							if (elName === "Fragment" || elName === "React.Fragment") {
								return;
							}

							const line = jsxNode.loc?.start.line || 0;
							const col = jsxNode.loc?.start.column || 0;
							const compID = `${relativePath}:${line}:${col}`;
							// const fileName = path.basename(id);

							magicString.appendLeft(
								jsxNode.name.end || 0,
								` data-zilver-id="${compID}" data-zilver-name="${elName}"`,
							);
						}
					},
				});
				return {
					code: magicString.toString(),
					map: magicString.generateMap({ hires: true }),
				};
			} catch (error) {
				console.error("Error processing file" + error);
				return null;
			}
		},
	};
}

// https://vite.dev/config/

const ReactCompilerConfig = {
	target: "18",
};

export default defineConfig(({ mode }) => {
	const pluginsArray: Array<PluginOption> = [
		TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
			},
		}),
	];

	if (mode === "development") {
		pluginsArray.push(tagPlugin());
	}

	return {
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"@backend": path.resolve(__dirname, "../backend"),
			},
			preserveSymlinks: true,
		},
		plugins: pluginsArray,
		server: {
			watch: {
				usePolling: true,
				alwaysStat: true,
				persistent: true,
			},
			hmr: {
				path: "/_vite_websockets",
			},
			allowedHosts: [".zilver.com", ".zilver.local", ".zilver.ai"],
		},
	};
});
