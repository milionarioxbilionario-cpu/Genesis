---
name: commits-on-main
description: User works directly on main in the Genesis repo; feature branches get merged straight back
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4e1e6fce-d498-46cc-b591-9634934f6a39
  modified: 2026-10-03T03:20:05.498Z
---

In the Genesis repo, the user wants commits to end up on `main`. When I committed CLAUDE.md on a side branch, they immediately asked to merge it into main.

**Why:** It's a solo project, and its history is all direct commits to main with no PR workflow.

**How to apply:** Still create a branch before committing, since the harness requires it. Then mention the merge-to-main option, or just fast-forward main when the user asks.
