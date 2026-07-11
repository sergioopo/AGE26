export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // Check periodically so an open dashboard picks up new deployments.
      window.setInterval(() => registration.update(), 60 * 60 * 1000);
    } catch (error) {
      console.error("No se ha podido activar el modo PWA.", error);
    }
  });
}
