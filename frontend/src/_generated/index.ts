import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { z } from "zod";

// ---- Service Name: Users ----
export const UsersGetUserByIdQueryInputSchema = z
	.object({ id: z.string().uuid().optional() })
	.strict();
export type UsersGetUserByIdOutputType = boolean;

export function useUsersGetUserByIdQuery(
	args: z.infer<typeof UsersGetUserByIdQueryInputSchema>,
	extraOptions?: Omit<
		UseQueryOptions<
			UsersGetUserByIdOutputType,
			Error,
			UsersGetUserByIdOutputType,
			Array<string>
		>,
		"queryKey" | "queryFn"
	>,
) {
	/*Get the user object by using its id.*/
	return useQuery({
		queryKey: ["Users", "GetUserById"],
		queryFn: async () => {
			const validationResult =
				await UsersGetUserByIdQueryInputSchema.safeParseAsync(args);
			if (validationResult.error) {
				console.error(
					"Error on input validation of GetUserById",
					validationResult.error,
				);
				throw new Error(validationResult.error.message);
			}

			const response = await fetch("/_api", {
				method: "POST",
				body: JSON.stringify({
					service: "Users",
					procedure: "GetUserById",
					data: validationResult.data,
				}),
			});

			if (!response.ok) {
				throw new Error("Non ok response");
			}

			const rawResponse = await response.json();
			return rawResponse["data"] as UsersGetUserByIdOutputType;
		},
		...extraOptions,
	});
}

export type UsersChangeUsernameOutputType = boolean;
export const UsersChangeUsernameInputSchema = z
	.object({ id: z.string().uuid(), newName: z.string().min(1).max(255) })
	.strict();
export function useUsersChangeUsernameMutation(
	extraOptions?: Omit<
		UseMutationOptions<
			UsersChangeUsernameOutputType,
			Error,
			z.infer<typeof UsersChangeUsernameInputSchema>,
			unknown
		>,
		"mutationFn"
	>,
) {
	/*Change a specific user's name using its id*/
	return useMutation({
		...extraOptions,
		mutationFn: async (
			args: z.infer<typeof UsersChangeUsernameInputSchema>,
		) => {
			const validationResult =
				await UsersChangeUsernameInputSchema.safeParseAsync(args);
			if (validationResult.error) {
				console.error(
					"Error on validating mutation input ",
					validationResult.error,
				);
				throw new Error(validationResult.error.message);
			}

			const response = await fetch("/_api", {
				method: "POST",
				body: JSON.stringify({
					service: "Users",
					procedure: "ChangeUsername",
					data: validationResult.data,
				}),
			});

			if (!response.ok) {
				throw new Error("Mutation error");
			}

			const rawResponse = await response.json();

			return rawResponse as UsersChangeUsernameOutputType;
		},
	});
}
//----
