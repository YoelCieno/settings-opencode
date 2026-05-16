# Git Strategy

## Default strategy

- **`dev` branch**: Working branch. All commits pushed here. Full history preserved — every commit, every trace.
- **`main` branch**: Release branch. Receives squashed commits from `dev` via `git merge --squash dev`. Clean linear history, one logical change per merge.

```
        dev:  a---b---c---d---e  (individual commits)
                       \
main (squash):          f       (single squash commit = a+b+c+d+e combined)
```

## Workflow

1. Daily work → commit on `dev`. Push often.
2. When ready to sync to `main`:

   ```
   git checkout main
   git merge --squash dev
   git commit -m "feat: <summary of squashed changes>"
   git push origin main
   git checkout dev
   ```

3. After merge, sync back: `git checkout dev && git merge main`. This advances the merge base — future squashes only pick up NEW commits on dev. Full history preserved on dev.

   **Why merge, not rebase:**
   - `git merge` preserves all individual commits on dev
   - The merge commit properly records the relationship, so next `git merge --squash dev` on main computes the merge base from the sync point, not from branch creation
   - Without sync, each squash re-includes old commits (duplicates)

## Per-project customization

This is the **default** strategy. When starting a new project, the agent will ask if you want to customize the strategy before proceeding.
