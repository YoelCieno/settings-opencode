# Amend workflows

## `a` (amend) — assumes already staged

1. `git status` — check staged changes exist
2. No staged changes → report "nothing staged to amend", exit
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. Verify: `git log --oneline -1`

## `sa` (stage+amend)

1. `git add .` — stage all changes
2. `git status` — confirm what's staged
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. Verify: `git log --oneline -1`

## `saps` (stage+amend+push)

1. `git add .` — stage all changes
2. `git status` — confirm what's staged
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. `git push` — push to remote
6. Verify: `git log --oneline -1`

## Important

- Amend rewrites commit hash. If already pushed, may need force-push (ask user first before `sa` or message-change amend).
- Do NOT amend if last commit is shared with others unless user confirms.
- `sa` stages ALL changes via `git add .`. For selective staging, use `s` then `a`.
