# Agent instructions

Rules for a coding agent (Claude Code, Codex, Cursor, or other) in this repo. A person follows the same rules.

Read first:
- https://docs.scalargis.com/llms.txt: index of the docs site, Contributing first.
- https://docs.scalargis.com/contributing.md: the full rules for a change.

Hard rules:
1. No code comments. Allowed: a one-line docstring (`/** Does X. */`) and a section marker in a template block (`<!-- combo -->`). An explanation goes in the commit message or the pull request description.
2. Few tests. Write a test only when a break loses money, lets the wrong user in, leaks personal data, or opens SQL or a CSV export to injection. Call the real code with real inputs, with no fakes. No test of a render result, a constant, or an import. Verify all else in the running app.
3. No `README.md` and no docs folder inside the repo or a component, such as `libs/components/src/lib/<Name>/`. The facts go to the docs site.
4. A change to a fact on the docs site names the page and the new fact in the pull request description. A maintainer updates the page.
5. `main` is the Mantine line. UI code uses Mantine and `@scalargis/ui`. The `prime-react` branch gets no new work.
6. A commit title is one plain sentence. No prefixes such as `feat:`, no scopes, no ticket ids.

Before the pull request to `main`:
```
npx nx run-many -t typecheck --all
npx nx run-many -t lint --all
npx nx run-many -t test --all
npx nx run viewer:build
npx nx run backoffice:build
```
Then use the feature in the running app.
