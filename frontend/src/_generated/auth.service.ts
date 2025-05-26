import {useMutation, UseMutationOptions} from "@tanstack/react-query";
import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import {z} from "zod"

// ---- Service Name: Auth ----
export type AuthRegisterOutputType = {
  user: {
    id: string;
    name: string;
    email: string;
    /** User role, defaults to 'user' */
    role?: "user" | "admin";
    /** Timestamp of user creation */
    createdAt: Date;
    /** Timestamp of last user update */
    updatedAt: Date;
  };
};
export const AuthRegisterInputSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();
export function useAuthRegisterMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      AuthRegisterOutputType,
      Error,
      z.infer<typeof AuthRegisterInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
) {
  /*Registers a new user. On success, automatically logs the user in and sets an 'auth_session' cookie (HttpOnly, Secure, SameSite=Lax) valid for 24 hours. Responds with 409 if email is already taken. This procedure always sets a new 'auth_session' cookie in the response on successful registration.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof AuthRegisterInputSchema>) => {
      const validationResult =
        await AuthRegisterInputSchema.safeParseAsync(args);
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
          service: "Auth",
          procedure: "Register",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as AuthRegisterOutputType;
    },
  });
}

export type AuthLoginOutputType = {
  user: {
    id: string;
    name: string;
    email: string;
    /** User role, defaults to 'user' */
    role?: "user" | "admin";
    /** Timestamp of user creation */
    createdAt: Date;
    /** Timestamp of last user update */
    updatedAt: Date;
  };
};
export const AuthLoginInputSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password cannot be less than 8 characters"),
  })
  .strict();
export function useAuthLoginMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      AuthLoginOutputType,
      Error,
      z.infer<typeof AuthLoginInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
) {
  /*Authenticates a user with email and password. Sets an 'auth_session' cookie (HttpOnly, Secure, SameSite=Lax) valid for 24 hours. Responds with 401 if credentials are invalid. This procedure always sets a new 'auth_session' cookie in the response on successful login.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof AuthLoginInputSchema>) => {
      const validationResult = await AuthLoginInputSchema.safeParseAsync(args);
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
          service: "Auth",
          procedure: "Login",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as AuthLoginOutputType;
    },
  });
}

export type AuthLogoutOutputType = {
  success: boolean;
};
export const AuthLogoutInputSchema = z.object({}).strict();
export function useAuthLogoutMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      AuthLogoutOutputType,
      Error,
      z.infer<typeof AuthLogoutInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
) {
  /*Invalidates the current user session by clearing the 'auth_session' cookie. Sets an expired 'auth_session' cookie to ensure client deletion. Always returns success, even if no session was active.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof AuthLogoutInputSchema>) => {
      const validationResult = await AuthLogoutInputSchema.safeParseAsync(args);
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
          service: "Auth",
          procedure: "Logout",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as AuthLogoutOutputType;
    },
  });
}

export const AuthGetProfileQueryInputSchema = z.object({}).strict();
export type AuthGetProfileOutputType = {
  id: string;
  name: string;
  email: string;
  /** User role, defaults to 'user' */
  role?: "user" | "admin";
  /** Timestamp of user creation */
  createdAt: Date;
  /** Timestamp of last user update */
  updatedAt: Date;
};

export function useAuthGetProfileQuery(
  args: z.infer<typeof AuthGetProfileQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      AuthGetProfileOutputType,
      Error,
      AuthGetProfileOutputType,
      Array<string>
    >,
    "queryKey" | "queryFn"
  >,
) {
  /*Retrieves the profile of the currently authenticated user based on the 'auth_session' cookie. Responds with 401 if no valid session is found. If the session is nearing expiration (e.g., less than 1 hour left), it may be refreshed, and a new 'auth_session' cookie will be set in the response.*/
  return useQuery({
    queryKey: ["Auth", "GetProfile"],
    queryFn: async () => {
      const validationResult =
        await AuthGetProfileQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of GetProfile",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Auth",
          procedure: "GetProfile",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as AuthGetProfileOutputType;
    },
    ...extraOptions,
  });
}
//----