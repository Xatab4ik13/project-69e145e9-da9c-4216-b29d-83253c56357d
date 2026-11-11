import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { appHost } from "./host";

export const getAppHost = createServerFn({ method: "GET" }).handler(() =>
  appHost(getRequest().headers.get("host")),
);
