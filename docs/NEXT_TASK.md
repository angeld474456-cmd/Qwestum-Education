# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan safe-integer validation alignment for task editor points inputs.

## Next Task

Sprint 12.18.35 - Editor Points Safe-Integer Validation Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.34 completed controlled live verification in owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`) with an empty baseline.
- The unique temporary `TEMP - Sprint 12.18.34 Points Verification DELETE ME` task used description `Disposable create and PATCH verification for safe integer points.`, correct answer `S34-CORRECT`, hint `S34-HINT`, type `text`, create points `7`, and PATCH points `12`.
- With No throttling and request blocking disabled, Add task was clicked once without error; the task appeared once, became selected, opened its editor, visibly persisted `7`, reset TaskForm points to `1` with all other creation fields, and returned loading to normal.
- A points-only PATCH changed `7` to `12` with one Save click and no error; refresh or reopening confirmed persisted `12` and no unrelated changes.
- Cleanup confirmed the exact task and points `12`, accepted native deletion confirmation once, removed only that task, restored the empty baseline, preserved Draft status, and left no error or residue.
- Follow-up UX mismatch: TextTaskEditor and SingleChoiceTaskEditor use raw string points and client-block empty, zero, negative, and decimal values, but use `Number.isInteger` rather than `Number.isSafeInteger`. Unsafe integers can reach PATCH; PATCH safely rejects them, so server integrity remains protected. No unsafe-integer browser write test occurred.
- TaskForm validation, strict POST/PATCH contracts, `Promise<boolean>`, failure preservation, success reset, ownership/authentication, selection, optional fields, types, images, Preview, publication guards, and deletion guards remain unchanged.

Planning topics:

- Inspect TextTaskEditor and SingleChoiceTaskEditor points parsing and validation.
- Align editor validation with TaskForm and PATCH.
- Require digit-only safe integers at least `1`.
- Preserve temporary empty editing and unsaved invalid local input after failed save.
- Add or align accessible inline error behavior.
- Avoid duplicated validation where practical.
- Identify the smallest safe file scope.
- No implementation or live write without explicit approval.
- No implementation until architecture approval.

Out of scope:

- Implementation before architecture approval or explicit live-write authorization.
- Route changes.
- API changes.
- Schema or migration changes.
- RLS policy changes.
- New indexes.
- Task content schema changes.
- Task type changes.
- Save or autosave changes.
- Storage writes.
- Runtime/student changes.
- Publication safety changes.
- Last-public-task deletion guard changes.
- Public catalog or student-facing changes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
