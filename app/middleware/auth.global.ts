const publicPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function safeRedirect(value: unknown): string | undefined {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchCurrentUser } = useAuth();
  await fetchCurrentUser();

  if (publicPaths.has(to.path)) {
    if (user.value) {
      return navigateTo(safeRedirect(to.query.redirect) ?? "/dashboard", {
        replace: true,
      });
    }
    return;
  }

  if (!user.value) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    }, {
      replace: true,
    });
  }
});
