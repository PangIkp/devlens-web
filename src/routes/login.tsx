import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { FieldError } from "@/components/ui/field-error";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLoginMutation } from "@/features/auth/auth.query";
import { useAuthStore } from "@/features/auth/auth.store";
import { getErrorMessage } from "@/lib/api-errors";
import { rootRoute } from "@/routes/root";

const highlights = [
  "Pull request cycle time",
  "Review bottlenecks",
  "Hotspot detection",
];

const loginFormSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search) =>
    loginSearchSchema.parse({
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    }),
  component: LoginPage,
});

function LoginPage() {
  const search = loginRoute.useSearch();
  const session = useAuthStore((state) => state.session);
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "local@devlens.test", name: "Local Dev" },
  });

  if (session) {
    return <Navigate to={search.redirect ?? "/"} replace />;
  }

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      email: values.email,
      name: values.name?.trim() || undefined,
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">DevLens</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in to DevLens</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Local development session — sign in with any email to unlock the repository workflows.
          </p>
        </div>

        <Card className="mt-8 p-8">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event);
            }}
            noValidate
          >
            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Email
                <RequiredMark />
              </span>
              <Input
                type="email"
                placeholder="local@devlens.test"
                aria-required="true"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Display name</span>
              <Input placeholder="Local Dev" aria-invalid={errors.name ? "true" : "false"} {...register("name")} />
              <FieldError message={errors.name?.message} />
            </label>

            {loginMutation.isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {getErrorMessage(loginMutation.error)}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
          {highlights.map((highlight, index) => (
            <li key={highlight} className="flex items-center gap-2">
              {index > 0 ? <span className="text-border" aria-hidden="true">·</span> : null}
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Calls <code>/auth/login</code> and stores the access and refresh tokens in local storage.
        </p>
      </div>
    </div>
  );
}
