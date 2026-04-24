import { getRequestConfig } from "next-intl/server";
import fs from "fs";
import path from "path";

export default getRequestConfig(async () => {
  const locale = "en";
  const dir = path.join(process.cwd(), `messages/${locale}`);

  const messages: Record<string, unknown> = {};

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const namespace = file.replace(".json", "");
    const key = namespace.charAt(0).toUpperCase() + namespace.slice(1);
    messages[key] = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as unknown;
  }

  return { locale, messages };
});
