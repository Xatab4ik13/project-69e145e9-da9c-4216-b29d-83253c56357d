import { expect, test } from "bun:test";
import { SESSION_DAYS } from "../src/app";

test("CRM login stays valid for a year", () => expect(SESSION_DAYS).toBe(365));
