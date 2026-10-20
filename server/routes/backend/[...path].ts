import {
  createError,
  defineEventHandler,
  getRequestURL,
  getRouterParam,
  proxyRequest,
} from "h3";

export default defineEventHandler((event) => {
  const path = getRouterParam(event, "path");
  if (!path) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const config = useRuntimeConfig(event);
  const configuredApiBase = config.public.apiBase.trim();
  if (!configuredApiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: "NUXT_PUBLIC_API_BASE must be configured",
    });
  }

  const apiOrigin = configuredApiBase
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  let target: URL;

  try {
    target = new URL(apiOrigin);
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: "The API base URL is invalid",
    });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw createError({
      statusCode: 500,
      statusMessage: "The API base URL must use HTTP or HTTPS",
    });
  }

  const basePath = target.pathname
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  const requestPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  target.pathname = `${basePath}/${requestPath}`.replace(/\/+/g, "/");
  target.search = getRequestURL(event).search;

  return proxyRequest(event, target.toString());
});
