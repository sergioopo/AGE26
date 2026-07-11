# AGE 2025 · Informe del simulador

Aplicación Vite preparada para Vercel. El ranking se almacena en PostgreSQL remoto mediante Neon; no se usa SQLite ni un proceso Node persistente.

## Configuración en Vercel

1. Crea una base Neon/PostgreSQL, por ejemplo desde el Marketplace de Vercel.
2. En **Settings → Environment Variables**, añade:

   ```text
   DATABASE_URL=postgresql://...
   CRON_SECRET=un-secreto-largo-y-aleatorio
   ```

3. Haz el deploy. Las tablas se crean automáticamente en la primera llamada API.

El botón **Actualizar ranking** ejecuta una sincronización manual. En Vercel Hobby, `vercel.json` programa además una sincronización diaria a las 06:00 UTC; en Pro puede ampliarse a cada seis horas. La ruta específica de Cron usa `CRON_SECRET` para aceptar exclusivamente a Vercel.

El extractor entra como invitado con P1/P2 y fallos a `0`. La plataforma entrega todos los participantes en un bloque de datos: el paginado de 500 es visual y no limita la extracción. Cada ejecución se compara por DRD contra la anterior y **Notas nuevas** muestra los incorporados.

## Desarrollo local

Para probar también las funciones API, configura las mismas variables en `.env.local` y ejecuta:

```bash
npx vercel dev
```
