/**
 * Activos rasterizados importados desde TypeScript (Vite los emite con hash en /assets y devuelve su URL pública).
 * Declaración ambiental: este archivo NO debe tener `import`/`export` de nivel superior, o dejaría de ser un script global.
 */
declare module '*.webp' {
  const url: string;
  export default url;
}
