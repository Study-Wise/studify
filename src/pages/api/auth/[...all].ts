import type { APIRoute } from "astro";
import { auth } from "@/lib/auth";

export const ALL: APIRoute = async (context) => {
  return auth.handler(context.request);
};

export const prerender = false;
