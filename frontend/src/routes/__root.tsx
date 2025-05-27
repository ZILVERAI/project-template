import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const sampleSchema = z.object({
  hello: z.string(),
});

function RootComponent() {
  useForm({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      hello: "",
    },
  });
  return (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </div>
      <hr />
      <Outlet />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
