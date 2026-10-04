const modules = import.meta.glob(['./components/*/src/Main.jsx', './components/*/src/Main.tsx']);

/** Imports the Main module of the plugin component in components/<type>, jsx first, then tsx. */
export function importComponentModule(type) {
  const load = modules[`./components/${type}/src/Main.jsx`] || modules[`./components/${type}/src/Main.tsx`];
  if (!load) return Promise.reject(new Error(`No Main.jsx or Main.tsx for component "${type}"`));
  return load();
}
