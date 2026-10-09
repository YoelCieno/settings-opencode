# Conventions + output format

## Commit Convention

Every commit message must follow this format:

```text
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

When scope is not useful or not clear, this no-scope form is also valid:

```text
<type>: <short summary>
```

### Allowed Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect behavior, such as formatting
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks such as tooling or build updates

### Commit Rules

- Prefer including a meaningful `scope` when the affected area is clear
- Omit `scope` instead of inventing one when it is not clear
- Use a concise present-tense summary
- Keep the summary focused on intent, not a file-by-file changelog
- Match the type to the actual purpose of the change

### Examples

- `feat(api): add user authentication endpoint`
- `fix(auth): prevent empty login submission`
- `chore(settings): sync opencode configuration`

## Branch Convention

Every branch name must follow this format:

```text
<type>/<scope>-<short-description>
```

### Branch Rules

- Reuse the same allowed `type` values as commits
- `scope` is required for branches
- `scope` must be a single lowercase token with letters and numbers only
- The first `-` after `/` separates `scope` from `short-description`
- Use a short kebab-case description
- Keep the branch name specific to the actual change
- If branch scope is ambiguous, ask one short question before creating the branch

### Examples

- `feat/auth-login-form`
- `fix/api-token-refresh`
- `chore/settings-git-workflow`

## Pull Request Rules

When the task includes PR creation or inspection:

- use `gh` for GitHub operations
- push the current branch with upstream tracking first if needed
- if a PR already exists for the current branch, return that URL instead of creating a duplicate
- choose the base branch from the repository default branch when available, otherwise prefer `main`, then `master`
- use a concise PR title aligned with the branch purpose and commit intent
- include a short `## Summary` section in the PR body

## Output Expectations

For git tasks, return:

- `Branch`: current or created branch name
- `Commit`: created or proposed commit message
- `Push`: yes or no
- `PR`: URL if created, otherwise `n/a`
- `Notes`: any blocker
