import { saveSync } from "../lib/database.js";
import { send } from "../lib/response.js";
import { fetchSimulatorRanking } from "../lib/scraper.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return send(response, 405, { error: "Método no permitido." });
  try { return send(response, 201, { sync: await saveSync(await fetchSimulatorRanking()) }); }
  catch (error) { return send(response, 502, { error: error.message || "No se ha podido actualizar el ranking." }); }
}
