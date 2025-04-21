import { io } from "socket.io-client";

type HelloWorldAPIResponse = string;

function getAPIURL(path?: string) {
	if (!path) {
		return "/_api";
	}

	return `/_api/${path}`;
}

export async function getHelloWorld() {
	const response = await fetch(getAPIURL());
	if (!response.ok) {
		throw new Error("Non ok response!");
	}

	const responseBody: HelloWorldAPIResponse = await response.text();
	return responseBody;
}

// Example of getting a socket io connection.
export function getSocket() {
	const socket = io("/", { path: "/_api/socket.io" });
	return socket;
}
