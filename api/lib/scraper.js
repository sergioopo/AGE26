const SOURCE_URL = "https://plataformafuncionarios.es/simulador-cortes/administrativo/index.php";

export async function fetchSimulatorRanking() {
  const form = new URLSearchParams({ accion: "guest_login", grupo_invitado: "general", a1_invitado: "0", f1_invitado: "0", a2_invitado: "0", f2_invitado: "0" });
  const response = await fetch(SOURCE_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form, redirect: "manual" });
  const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [response.headers.get("set-cookie")].filter(Boolean);
  const cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const page = response.status >= 300 && response.status < 400
    ? await fetch(new URL(response.headers.get("location"), SOURCE_URL), { headers: { cookie } })
    : response;
  if (!page.ok) throw new Error(`La plataforma devolvió HTTP ${page.status}.`);
  const html = await page.text();
  const match = html.match(/var\s+PARTICIPANTES\s*=\s*(\[[\s\S]*?\]);\s*\n\s*var\s+MI_CODIGO/);
  if (!match) throw new Error("No se ha encontrado el ranking en la respuesta de la plataforma.");
  return JSON.parse(match[1]).filter(({ codigo }) => codigo && codigo !== "INVITADO").map((row) => ({
    drd: String(row.codigo).trim().toLowerCase(), groupName: row.grupo === "cupo" ? "cupo" : "general", province: row.prov_pref && row.prov_pref !== "—" ? String(row.prov_pref).trim() : "", rawP1: Number(row.neta_p1), rawP2: Number(row.neta_p2),
  })).filter(({ drd, rawP1, rawP2 }) => drd && Number.isFinite(rawP1) && Number.isFinite(rawP2));
}
