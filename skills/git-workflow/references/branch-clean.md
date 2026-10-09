# bcl — branch-clean workflow

1. Ask user for confirmation before deleting (destructive operation)
2. Collect merged branches:
   ```bash
   git branch --merged | grep -v -E "(^\*|master|main|dev)"
   ```
3. Exclude branches with active worktrees:
   ```bash
   git worktree list --porcelain | grep '^HEAD ' | sed 's|^HEAD refs/heads/||'
   ```
4. Delete matched branches:
   ```bash
   git branch --merged \
     | grep -v -E "(^\*|master|main|dev)" \
     | sed 's/^..//' \
     | grep -v -F -f <(git worktree list --porcelain | grep '^HEAD ' | sed 's|^HEAD refs/heads/||') \
     | xargs -r git branch -D
   ```
5. Report: which branches were deleted, which were skipped (and why).
