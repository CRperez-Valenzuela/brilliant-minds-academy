import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = fileURLToPath(new URL('.', import.meta.url));

/**
 * Salida: la carpeta `public/` de Express (../public respecto a frontend/).
 *   /admin/index.html · /admisiones/index.html · /portal/index.html · /assets/*.js|css (con hash)
 * Express (app.js) ya sirve /admin, /admisiones y GET /portal/:token; /assets se sirve con su propio static.
 */

/** Solo en `vite dev`: replica las rutas de Express (/admin, /admisiones, /portal/:token). */
function rutasDeExpress(): Plugin {
  return {
    name: 'bma-rutas-express',
    configureServer(servidor) {
      servidor.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/';
        const ruta = url.split('?')[0] ?? '/';
        const consulta = url.slice(ruta.length);
        if (ruta === '/admin' || ruta === '/admisiones') req.url = `${ruta}/${consulta}`;
        else if (ruta.startsWith('/portal/') && ruta !== '/portal/index.html') req.url = `/portal/index.html${consulta}`;
        next();
      });
    },
  };
}

export default defineConfig({
  root: aqui,
  base: '/',
  appType: 'mpa',
  plugins: [rutasDeExpress()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
  build: {
    outDir: resolve(aqui, '../public'),
    emptyOutDir: true, // compilación limpia: elimina los archivos estáticos anteriores de public/
    assetsDir: 'assets',
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      input: {
        admin: resolve(aqui, 'admin/index.html'),
        admisiones: resolve(aqui, 'admisiones/index.html'),
        portal: resolve(aqui, 'portal/index.html'),
      },
    },
  },
});
