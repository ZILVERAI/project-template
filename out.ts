import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// ---- Service Name: Users ----
type UsersGetUserByIdOutputType = {
  id: string;
  userName: string;
  email: string;
};

export function useUsersGetUserByIdQuery(args: { id: string }) {
  /*Get the user object by using its id.*/
  return useQuery({
    queryKey: ["Users", "GetUserById"],
    queryFn: async () => {
      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Users",
          proc: "GetUserById",
          data: args,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as UsersGetUserByIdOutputType;
    },
  });
}

type UsersChangeUsernameOutputType = boolean;

export function useUsersChangeUsernameMutation() {
  /*Change a specific user's name using its id*/
  return useMutation({
    mutationFn: async (args: { id: string; newName: string }) => {
      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Users",
          proc: "ChangeUsername",
          data: args,
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

type UsersDeleteUserOutputType = {
  deleteTime: Date;
};

export function useUsersDeleteUserMutation() {
  /*Deletes and user's account*/
  return useMutation({
    mutationFn: async (args: { id: string; image: any }) => {
      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Users",
          proc: "DeleteUser",
          data: args,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse as UsersDeleteUserOutputType;
    },
  });
}
//----
