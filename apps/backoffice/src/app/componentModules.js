const modules = import.meta.glob([
  './components/*/src/Manager.jsx',
  './components/*/src/Manager.tsx',
  './components/*/src/Main.jsx',
  './components/*/src/Main.tsx',
]);

const ENTRIES = ['Manager.jsx', 'Manager.tsx', 'Main.jsx', 'Main.tsx'];

/** Loads the backoffice entry of a component, or resolves to null when the build does not hold it. */
export function loadComponentModule(name) {
  for (const entry of ENTRIES) {
    const load = modules[`./components/${name}/src/${entry}`];
    if (load) return load();
  }
  return Promise.resolve(null);
}
