import { defineConfig, Plugin, PluginOption, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { parse, ParserOptions } from "@babel/parser";
import _traverse from "@babel/traverse";
import generate from "@babel/generator";

import {
	tanstackRouterAutoImport,
	tanStackRouterCodeSplitter,
} from "@tanstack/router-plugin/vite";

import MagicString from "magic-string";
import * as t from "@babel/types";
// import { walk } from "estree-walker";
////
import { JSXIdentifier, JSXMemberExpression } from "@babel/types";

const taggableExtensions = new Set([".jsx", ".tsx"]);

interface ClassUpdate {
	classes: string[];
	line: number;
	column: number;
}

interface ClassMapping {
	[filePath: string]: ClassUpdate[];
}
//
function parseZilverID(
	zilverID: string,
): { filePath: string; line: number; column: number } | null {
	// Format: "src/routes/index.tsx:274:11"
	const match = zilverID.match(/^(.+):(\d+):(\d+)$/);
	if (!match) return null;

	return {
		filePath: match[1],
		line: parseInt(match[2], 10),
		column: parseInt(match[3], 10),
	};
}

function codeTransformation(code: string, id: string, classMap: ClassMapping) {
	if (!id.match(/\.[jt]sx$/)) return null;

	const fileUpdates = classMap[id];
	console.log("Transform called for:", id);
	console.log("fileUpdates:", fileUpdates);
	if (!fileUpdates || fileUpdates.length === 0) return null;
	//
	console.log("=== CODE SAMPLE (first 500 chars) ===");
	console.log(code.substring(0, 500));
	console.log("=== END CODE SAMPLE ===");

	const ast = parse(code, {
		sourceType: "module",
		plugins: ["typescript", "jsx"],
	});

	let modified = false;

	let traverse: typeof _traverse;

	if (typeof _traverse === "function") {
		traverse = _traverse;
	} else {
		//@ts-expect-error Lib is bugged
		traverse = _traverse.default;
	}
	console.log("About to traverse, traverse is:", typeof traverse);

	traverse(ast, {
		enter(path) {
			//
			//
			/////
			// Only process JSX opening elements
			//
			if (path.node.type !== "JSXOpeningElement") return;
			console.log("Found jsx");
			const node = path.node as t.JSXOpeningElement;
			const loc = node.loc;

			if (!loc) return;
			console.log("Found loc");
			////
			// Find if this element's location matches any of our updates
			// AST lines are 1-indexed, columns are 0-indexed
			const update = fileUpdates.find((u) => u.line === loc.start.line);

			if (!update || update.classes.length === 0) {
				console.log("No updates found...");
				return;
			}

			const newClasses = update.classes.join(" ");

			// Find existing className attribute
			const classNameAttrIndex = node.attributes.findIndex(
				(attr) => t.isJSXAttribute(attr) && attr.name.name === "className",
			);

			if (classNameAttrIndex !== -1) {
				const classNameAttr = node.attributes[
					classNameAttrIndex
				] as t.JSXAttribute;

				if (t.isStringLiteral(classNameAttr.value)) {
					// Simple string: className="foo bar"
					classNameAttr.value.value = mergeClasses(
						classNameAttr.value.value,
						newClasses,
					);
					modified = true;
				} else if (t.isJSXExpressionContainer(classNameAttr.value)) {
					const expr = classNameAttr.value.expression;

					if (t.isStringLiteral(expr)) {
						// className={"foo bar"}
						expr.value = mergeClasses(expr.value, newClasses);
						modified = true;
					} else if (t.isTemplateLiteral(expr) && expr.quasis.length === 1) {
						// className={`foo bar`} (no interpolations)
						expr.quasis[0].value.raw = mergeClasses(
							expr.quasis[0].value.raw,
							newClasses,
						);
						expr.quasis[0].value.cooked = expr.quasis[0].value.raw;
						modified = true;
					} else if (t.isCallExpression(expr)) {
						// className={cn("foo", "bar")} - inject as first argument
						expr.arguments.unshift(t.stringLiteral(newClasses));
						modified = true;
					} else {
						// Complex expression - wrap in template literal
						classNameAttr.value = t.jsxExpressionContainer(
							t.templateLiteral(
								[
									t.templateElement(
										{ raw: newClasses + " ", cooked: newClasses + " " },
										false,
									),
									t.templateElement({ raw: "", cooked: "" }, true),
								],
								[expr as t.Expression],
							),
						);
						modified = true;
					}
				}
			} else {
				// No className attribute - add one
				node.attributes.push(
					t.jsxAttribute(
						t.jsxIdentifier("className"),
						t.stringLiteral(newClasses),
					),
				);
				modified = true;
			}
		},
	});
	//
	//

	if (!modified) {
		console.log("No modifications made");
		return null;
	}

	console.log("Modifications made, returning new code and writting to file.");
	const output = generate(ast, { retainLines: true }, code);
	return { code: output.code, map: output.map };
}
//
export function zilverClassesPlugin(): Plugin {
	const classMap: ClassMapping = {};
	let server: ViteDevServer;
	let rootDir: string;
	////
	return {
		name: "vite-plugin-zilver-classes",
		enforce: "pre",

		configResolved(config) {
			rootDir = config.root;
		},

		configureServer(_server) {
			server = _server;

			server.ws.on("zilver:add-class", async (data, client) => {
				const { zilverID, classes } = data;
				const parsed = parseZilverID(zilverID);

				if (!parsed) {
					client.send("zilver:error", { message: "Invalid zilver ID format" });
					return;
				}

				const { filePath, line, column } = parsed;
				const absolutePath = path.resolve(rootDir, filePath);

				if (!classMap[absolutePath]) {
					classMap[absolutePath] = [];
				}

				// Find existing entry for this location or create new one
				const existing = classMap[absolutePath].find(
					(e) => e.line === line && e.column === column,
				);

				if (existing) {
					// Merge classes, avoiding duplicates
					for (const cls of classes) {
						if (!existing.classes.includes(cls)) {
							existing.classes.push(cls);
						}
					}
				} else {
					classMap[absolutePath].push({ line, column, classes: [...classes] });
				}

				const fs = await import("fs/promises");
				const originalCode = await fs.readFile(absolutePath, "utf-8");

				const result = codeTransformation(originalCode, absolutePath, classMap);

				if (!result) {
					console.error("Failed at making change");
					return;
				}

				await fs.writeFile(absolutePath, result.code, "utf-8");

				client.send("zilver:class-updated", {
					zilverID,
					classes: existing?.classes ?? classes,
				});
			});

			server.ws.on("zilver:remove-class", (data, client) => {
				const { zilverID, classes } = data;
				const parsed = parseZilverID(zilverID);

				if (!parsed) return;

				const { filePath, line, column } = parsed;
				const absolutePath = path.resolve(rootDir, filePath);

				const fileUpdates = classMap[absolutePath];
				if (!fileUpdates) return;

				const existing = fileUpdates.find(
					(e) => e.line === line && e.column === column,
				);

				if (existing) {
					existing.classes = existing.classes.filter(
						(c) => !classes.includes(c),
					);

					// Remove entry if no classes left
					if (existing.classes.length === 0) {
						const idx = fileUpdates.indexOf(existing);
						fileUpdates.splice(idx, 1);
					}
				}

				const mod = server.moduleGraph.getModuleById(absolutePath);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}

				client.send("zilver:class-updated", {
					zilverID,
					classes: existing?.classes ?? [],
				});
				server.ws.send({ type: "full-reload" });
			});

			server.ws.on("zilver:get-classes", (data, client) => {
				const { zilverID } = data;
				const parsed = parseZilverID(zilverID);

				if (!parsed) {
					client.send("zilver:classes", { zilverID, classes: [] });
					return;
				}

				const { filePath, line, column } = parsed;
				const absolutePath = path.resolve(rootDir, filePath);

				const existing = classMap[absolutePath]?.find(
					(e) => e.line === line && e.column === column,
				);

				client.send("zilver:classes", {
					zilverID,
					classes: existing?.classes ?? [],
				});
			});
		},

		transform(code, id) {
			if (!id.match(/\.[jt]sx$/)) return null;

			const fileUpdates = classMap[id];
			console.log("Transform called for:", id);
			console.log("fileUpdates:", fileUpdates);
			if (!fileUpdates || fileUpdates.length === 0) return null;
			//
			console.log("=== CODE SAMPLE (first 500 chars) ===");
			console.log(code.substring(0, 500));
			console.log("=== END CODE SAMPLE ===");

			const ast = parse(code, {
				sourceType: "module",
				plugins: ["typescript", "jsx"],
			});

			let modified = false;

			let traverse: typeof _traverse;

			if (typeof _traverse === "function") {
				traverse = _traverse;
			} else {
				//@ts-expect-error Lib is bugged
				traverse = _traverse.default;
			}
			console.log("About to traverse, traverse is:", typeof traverse);

			traverse(ast, {
				enter(path) {
					//
					//
					/////
					// Only process JSX opening elements
					//
					if (path.node.type !== "JSXOpeningElement") return;
					console.log("Found jsx");
					const node = path.node as t.JSXOpeningElement;
					const loc = node.loc;

					if (!loc) return;
					console.log("Found loc");
					////
					// Find if this element's location matches any of our updates
					// AST lines are 1-indexed, columns are 0-indexed
					const update = fileUpdates.find((u) => u.line === loc.start.line);

					if (!update || update.classes.length === 0) {
						console.log("No updates found...");
						return;
					}

					const newClasses = update.classes.join(" ");

					// Find existing className attribute
					const classNameAttrIndex = node.attributes.findIndex(
						(attr) => t.isJSXAttribute(attr) && attr.name.name === "className",
					);

					if (classNameAttrIndex !== -1) {
						const classNameAttr = node.attributes[
							classNameAttrIndex
						] as t.JSXAttribute;

						if (t.isStringLiteral(classNameAttr.value)) {
							// Simple string: className="foo bar"
							classNameAttr.value.value = mergeClasses(
								classNameAttr.value.value,
								newClasses,
							);
							modified = true;
						} else if (t.isJSXExpressionContainer(classNameAttr.value)) {
							const expr = classNameAttr.value.expression;

							if (t.isStringLiteral(expr)) {
								// className={"foo bar"}
								expr.value = mergeClasses(expr.value, newClasses);
								modified = true;
							} else if (
								t.isTemplateLiteral(expr) &&
								expr.quasis.length === 1
							) {
								// className={`foo bar`} (no interpolations)
								expr.quasis[0].value.raw = mergeClasses(
									expr.quasis[0].value.raw,
									newClasses,
								);
								expr.quasis[0].value.cooked = expr.quasis[0].value.raw;
								modified = true;
							} else if (t.isCallExpression(expr)) {
								// className={cn("foo", "bar")} - inject as first argument
								expr.arguments.unshift(t.stringLiteral(newClasses));
								modified = true;
							} else {
								// Complex expression - wrap in template literal
								classNameAttr.value = t.jsxExpressionContainer(
									t.templateLiteral(
										[
											t.templateElement(
												{ raw: newClasses + " ", cooked: newClasses + " " },
												false,
											),
											t.templateElement({ raw: "", cooked: "" }, true),
										],
										[expr as t.Expression],
									),
								);
								modified = true;
							}
						}
					} else {
						// No className attribute - add one
						node.attributes.push(
							t.jsxAttribute(
								t.jsxIdentifier("className"),
								t.stringLiteral(newClasses),
							),
						);
						modified = true;
					}
				},
			});
			//
			//

			if (!modified) {
				console.log("No modifications made");
				return null;
			}

			console.log(
				"Modifications made, returning new code and writting to file.",
			);
			const output = generate(ast, { retainLines: true }, code);
			return { code: output.code, map: output.map };
		},
	};
}

function mergeClasses(existing: string, newClasses: string): string {
	const existingList = existing.split(/\s+/).filter(Boolean);
	const newList = newClasses.split(/\s+/).filter(Boolean);

	const result: string[] = [];
	const seenPrefixes = new Set<string>();

	// Add new classes first (they take priority)
	for (const cls of newList) {
		const prefix = getUtilityPrefix(cls);
		seenPrefixes.add(prefix);
		result.push(cls);
	}

	// Add existing classes that don't conflict
	for (const cls of existingList) {
		const prefix = getUtilityPrefix(cls);
		if (!seenPrefixes.has(prefix)) {
			result.push(cls);
			seenPrefixes.add(prefix);
		}
	}

	return result.join(" ");
}

function getUtilityPrefix(cls: string): string {
	// Handle negative values like -mt-4
	const normalized = cls.startsWith("-") ? cls.slice(1) : cls;

	// Common Tailwind prefixes that should be treated as the same "slot"
	const prefixPatterns = [
		/^(bg)-/,
		/^(text)-(?!opacity)/,
		/^(text-opacity)-/,
		/^(font)-/,
		/^(p|px|py|pt|pr|pb|pl)-/,
		/^(m|mx|my|mt|mr|mb|ml)-/,
		/^(w)-/,
		/^(h)-/,
		/^(min-w)-/,
		/^(min-h)-/,
		/^(max-w)-/,
		/^(max-h)-/,
		/^(rounded|rounded-t|rounded-r|rounded-b|rounded-l|rounded-tl|rounded-tr|rounded-bl|rounded-br)-/,
		/^(border|border-t|border-r|border-b|border-l)-(?!opacity)/,
		/^(shadow)-/,
		/^(opacity)-/,
		/^(z)-/,
		/^(gap|gap-x|gap-y)-/,
		/^(justify)-/,
		/^(items)-/,
		/^(self)-/,
		/^(flex)-/,
		/^(grid-cols)-/,
		/^(grid-rows)-/,
	];

	for (const pattern of prefixPatterns) {
		const match = normalized.match(pattern);
		if (match) {
			return match[1];
		}
	}

	// For non-value utilities like "flex", "hidden", "block", etc.
	// Return the whole class as its own "prefix" so duplicates are removed
	return cls;
}

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
				//
				console.log("=== CODE SAMPLE (first 500 chars) ===");
				console.log(code.substring(0, 500));
				console.log("=== END CODE SAMPLE ===");

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
						// const s = JSON.stringify(nodePath);
						// if (s.includes("p-2")) {
						// 	console.log(s);
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
							////
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
		tanstackRouterAutoImport({
			target: "react",
			enableRouteGeneration: true,
			enableRouteTreeFormatting: true,
		}),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
			},
		}),
	];
	//
	if (mode === "development") {
		pluginsArray.unshift(tagPlugin());
		pluginsArray.unshift(zilverClassesPlugin());
		///
	} else {
		pluginsArray.unshift(
			tanStackRouterCodeSplitter({
				target: "react",
				autoCodeSplitting: true,
			}),
		);
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
