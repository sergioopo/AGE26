import process from "node:process";
import { saveSync } from "../lib/database.js";
import { send } from "../lib/response.js";
import { fetchSimulatorRanking } from "../lib/scraper.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return send(response, 405, { error: "Método no permitido." });
  if (!process.env.CRON_SECRET || request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return send(response, 401, { error: "Cron no autorizado." });
  try { return send(response, 201, { sync: await saveSync(await fetchSimulatorRanking()) }); }
  catch (error) { return send(response, 502, { error: error.message || "No se ha podido actualizar el ranking." }); }
}
