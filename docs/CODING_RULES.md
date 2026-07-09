# Coding Rules

## Project Rules

- Do not commit unless explicitly asked.
- Do not push unless explicitly asked.
- Keep changes minimal and scoped.
- Do not refactor completed architecture without permission.
- Preserve Russian UI text.
- Avoid broad cleanup while implementing a feature.
- Work with any existing uncommitted changes; do not revert user work.

## Required Checks

Always run before finishing:

```powershell
npm.cmd run lint
npm.cmd run build
```

When touching UI text, check for mojibake:

```powershell
rg -n "Р’|Рќ|Р |С‹|СЊ|рџ" components app docs
```

## Next.js 16 Rule

This project uses Next.js 16. It may differ from older Next.js conventions.

Before changing Next.js routing, server/client component boundaries, data fetching, or related APIs, read the relevant guide in:

```text
node_modules/next/dist/docs/
```

## Architecture Rules

- Keep the Task Editor modular.
- Add task types through `TaskTypeRegistry`.
- Keep runtime rendering separate from editor-only behavior.
- Reuse preview/runtime renderers when possible.
- Keep task-specific JSONB parsing and validation close to the related task type.
- Do not bypass `RuntimeContext` for quest runtime state.

## Documentation Rules

- Keep docs concise but useful.
- Write project documentation in English.
- Update `docs/NEXT_TASK.md` when handing off a new milestone or next slice.
