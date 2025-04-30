import { io, Socket } from "socket.io-client";

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

let socket: Socket | undefined = undefined;
// Example of getting a socket io connection.
export function getSocket() {
	if (socket !== undefined) {
		return socket;
	}

	socket = io("/", { path: "/_api/socket.io" });
	return socket;
}
