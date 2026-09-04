# Local child repositories

Put a child project checkout directly under this directory, for example
`checkouts/pilot-task-ledger/`. The directory is part of the HQ file tree, so a
human can open child projects directly from the IDE without finding a separate
workspace path.

The HQ Git repository ignores every child checkout here, including its `.git`
directory. Do not add child source files from the HQ. Work inside a child with
its own Git repository instead:

```bash
git -C checkouts/<project-id> status
```

Register the child's stable identity in `projects/<project-id>/project.yaml`
and its machine-local path in the ignored `projects.local.yaml`. If the local
checkout is missing, Wake reports it as unavailable rather than guessing where
it moved.

For a deliberately local-only child repository, declare `local_only: true` in
its `repository` mapping and do not configure an `origin` remote. Wake then
verifies the local Git checkout without inventing an external canonical remote.
