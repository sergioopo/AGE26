import { getCurrentParticipants } from "../lib/database.js";
import { send } from "../lib/response.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return send(response, 405, { error: "Método no permitido." });
  try { return send(response, 200, { participants: await getCurrentParticipants() }); }
  catch (error) { return send(response, 500, { error: error.message }); }
}
