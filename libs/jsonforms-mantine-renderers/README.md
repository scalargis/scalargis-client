# jsonforms-mantine-renderers

Mantine port of `libs/jsonforms-primereact-renderers` (migration2 plan deliverable 1d). Same registered renderer set, same testers and ranks; widgets themed by the ADS base theme from `@scalargis/ui`. Import as `@scalargis/jsonforms-mantine-renderers`:

```tsx
import { mantineRenderers, mantineCells } from '@scalargis/jsonforms-mantine-renderers';

<JsonForms schema={schema} uischema={uischema} data={data}
  renderers={mantineRenderers} cells={mantineCells} onChange={...} />
```

Parity is judged against the migration1 baseline procedure on the harness twin page `/demo-ext/jsonforms-mantine`, which renders both renderer sets side by side over shared data. Behavioural contracts carried over and the documented intended differences (multi → Textarea, checkbox label placement, picker widgets instead of native date inputs) are listed in the registry module header and `migration2/mantine/qa/phase-1.md`.

Out of scope here: the custom ScalarGIS renderers in `libs/components/src/lib/JsonForm/` (photo/file/extended enum) port together with that wrapper when its consumers migrate (Phase 3). The Prime lib is retired in Phase 3 after its last consumer moves.

## Running unit tests

Run `npx vitest run --config libs/jsonforms-mantine-renderers/vite.config.ts`.
