/* =====================================================================
   Client-theme registry — how a theme picked DEEP in the tree reaches
   the ONE MantineProvider at the root (B2).

   Mantine portals every overlay (Modal, Select dropdown, toasts) to
   document.body, so a client theme applied through a nested provider
   would brand the page but not its dialogs. The theme object therefore
   has to land on AdsProviders' root provider — and the component that
   knows WHICH theme is active (the viewer's ThemeSelector, reading
   siteConfig/viewer config) sits far below it. This registry is the
   channel between the two.

   Contributions nest: the viewer mounts a site-level ThemeSelector
   (RGPD — splash/auth pages) and, inside it, a viewer-level one
   (Layout — config_json.theme). The most recent registration wins,
   which makes the inner selector's theme active while a viewer is open
   and hands control back to the site theme when it unmounts. (An outer
   selector re-registering WHILE an inner one is mounted would steal
   precedence, but site/viewer theme names only change with a config
   (re)load, which re-runs the inner effect too.)

   While a client theme is active the registry also stamps
   `data-sg-theme="<name>"` on <html> — the scoping hook for brand
   chrome CSS (viewer client-brands.css; a theme submodule's own CSS
   should scope the same way). Removing the attribute un-brands the
   chrome without any stylesheet unloading.
   ===================================================================== */

import React from 'react';
import type { MantineThemeOverride } from '@mantine/core';

export interface ClientThemeEntry {
  /** The active theme's config slug — becomes data-sg-theme on <html>. */
  name: string;
  /** The merged override for MantineProvider; null = explicit ADS base. */
  theme: MantineThemeOverride | null;
}

interface RegisteredEntry extends ClientThemeEntry {
  order: number;
}

interface ClientThemeRegistry {
  register(id: string, entry: ClientThemeEntry): void;
  unregister(id: string): void;
}

const ClientThemeRegistryContext = React.createContext<ClientThemeRegistry | null>(null);

/** AdsProviders-internal: owns the registrations and derives the winner. */
export function useClientThemeManager(): {
  registry: ClientThemeRegistry;
  active: ClientThemeEntry | null;
} {
  const orderRef = React.useRef(0);
  const [entries, setEntries] = React.useState<ReadonlyMap<string, RegisteredEntry>>(
    () => new Map()
  );

  const registry = React.useMemo<ClientThemeRegistry>(
    () => ({
      register(id, entry) {
        setEntries((previous) => {
          const next = new Map(previous);
          next.set(id, { ...entry, order: ++orderRef.current });
          return next;
        });
      },
      unregister(id) {
        setEntries((previous) => {
          if (!previous.has(id)) return previous;
          const next = new Map(previous);
          next.delete(id);
          return next;
        });
      },
    }),
    []
  );

  let active: RegisteredEntry | null = null;
  for (const entry of entries.values()) {
    if (!active || entry.order > active.order) active = entry;
  }

  const activeName = active?.theme ? active.name : undefined;
  React.useEffect(() => {
    const root = document.documentElement;
    if (activeName && activeName !== 'default') {
      root.dataset.sgTheme = activeName;
    } else {
      delete root.dataset.sgTheme;
    }
    // Cleanup on change AND unmount — the next effect re-stamps; a torn-down
    // provider must not leave stale brand scoping on <html>.
    return () => {
      delete root.dataset.sgTheme;
    };
  }, [activeName]);

  return { registry, active };
}

export function ClientThemeRegistryProvider({
  registry,
  children,
}: {
  registry: ClientThemeRegistry;
  children: React.ReactNode;
}) {
  return (
    <ClientThemeRegistryContext.Provider value={registry}>
      {children}
    </ClientThemeRegistryContext.Provider>
  );
}

/**
 * Contribute a client theme to the app-root provider.
 *
 * - `undefined` — nothing yet (theme still resolving): contributes nothing,
 *   so the previously active theme holds and switches never flash the base.
 * - `null` — explicitly the ADS base (a deploy on 'default', or a legacy
 *   Prime-era theme module that carries no Mantine override).
 * - `{ name, theme }` — a preset's or theme module's merged override.
 *
 * Outside AdsProviders (plain tests, isolated stories) this is a no-op.
 */
export function useApplyClientTheme(entry: ClientThemeEntry | null | undefined): void {
  const id = React.useId();
  const registry = React.useContext(ClientThemeRegistryContext);

  const resolved: ClientThemeEntry | undefined =
    entry === null ? { name: 'default', theme: null } : entry;
  const name = resolved?.name;
  const theme = resolved?.theme;

  React.useEffect(() => {
    if (!registry || name === undefined) return undefined;
    registry.register(id, { name, theme: theme ?? null });
    return () => registry.unregister(id);
  }, [registry, id, name, theme]);
}
