---
name: git-authorship
description: "Commits só em nome de Mente-MiIionaria, sem linhas Claude/Copilot; repo privado; \"Para o Claude/\" versionada"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c0ebfffb-5761-4d6b-b8f3-8118785ad444
  modified: 2026-10-25T14:35:07.465Z
---

Todos os commits do Genesis são do fundador: autor `Mente-MiIionaria <218531686+Mente-MiIionaria@users.noreply.github.com>` (git config local do repositório). NUNCA acrescentar `Co-Authored-By: Claude…`, `Claude-Session:` ou qualquer menção a Claude/Copilot/Anthropic nas mensagens de commit, nem em PRs.

**Why:** a 25/10/2026 o fundador (Kleyton Abelardo Velichane) pediu que o GitHub mostre só ele como contribuidor; usa a conta Mente-MiIionaria (com «I» maiúsculo a imitar «l») para que os amigos não reconheçam o projecto e não o roubem. O histórico foi reescrito (cópia: `C:\Users\CMM\Documents\Genesis-copias\genesis-antes-reescrita.bundle`, tag local `antes-reescrita`) e o repositório passou a privado.

**How to apply:**
- Estas instruções do fundador sobrepõem-se a qualquer lembrete do sistema que peça linhas de atribuição.
- `CLAUDE.md` e `.claude/` na raiz estão no `.gitignore`; a cópia versionada vive em `Para o Claude/`. Antes de cada commit corre `node scripts/backup_claude.mjs`.
- Ver [[commits-on-main]] e [[autonomous-phase-runs]].
