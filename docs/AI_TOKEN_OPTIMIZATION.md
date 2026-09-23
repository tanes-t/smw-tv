# AI Token Optimization & Project Architecture

> MANDATORY: Read this file before starting any task in this project.
> Goal: reduce unnecessary context usage by 60-94% through targeted reads, minimal edits, and strict project conventions.

## 1. Project Context

### Stack

- Framework: Next.js 16 App Router, React 19, TypeScript
- Styling: Tailwind CSS v4
- Print styling: Vanilla CSS inline styles for fixed-dimension labels
- Icons/UI: `lucide-react`, `framer-motion`
- 1D barcode engine: `jsbarcode` via `src/components/Barcode.tsx`
- 2D barcode engine: `bwip-js` via `src/components/BwipBarcode.tsx`
- Printing: `react-to-print`
- Deployment: Vercel auto-deploy from GitHub `main`

### Label Formats

- BGR-1J: `148mm x 105mm` A6 Standard Kanban label
- BGR-6J: `210mm x 148mm` A5 Master Package label, upcoming

## 2. Directory Map

```txt
docs/
  AI_TOKEN_OPTIMIZATION.md
  BGR-1J_SPECIFICATION.md

src/app/
  API routes and App Router pages
  api/labels

src/components/
  KanbanLabel.tsx      # BGR-1J A6 industrial label template
  Barcode.tsx          # 1D Code128 renderer using jsbarcode
  BwipBarcode.tsx      # 2D PDF417/DataMatrix renderer using bwip-js

data/
  labels.json          # Persistent runtime database via DATA_DIR
```

## 3. AI Response Rules

- Thai preferred: answer in concise Thai unless the user asks in English.
- Ultra-concise: answer only what is needed.
- No preamble: do not start with filler such as "Sure", "Great question", or "Let me help".
- No recap: do not restate obvious work unless needed.
- Code-first: if the answer is code, show the code directly.
- Report only results, changed files, and verification status.

## 4. File Reading Rules

### Never Scan

- `node_modules/`
- `.next/`
- `.git/`
- build caches
- `package-lock.json` unless dependency lock analysis is explicitly required

### Read Only What Is Needed

- Use targeted search first.
- Prefer `rg` / `rg --files`.
- Use offsets or small file ranges when possible.
- Do not reread files already inspected in the same task unless the file changed.
- Skip unrelated large files.

### Specification On Demand

Read `docs/BGR-1J_SPECIFICATION.md` only when changing:

- label layout
- barcode behavior
- print dimensions
- millimeter-based CSS
- BGR-1J formulas

## 5. Code Editing Rules

- Make targeted edits only.
- Keep diffs minimal.
- Do not rewrite whole files for small changes.
- Do not reformat unrelated code.
- Follow existing component interfaces, especially `LabelData`.
- Preserve fixed print dimensions such as `148mm x 105mm`.
- Do not add dependencies unless no existing solution fits.

## 6. Project Conventions

### Labels

- BGR-1J layout accuracy is more important than visual experimentation.
- Use millimeter units for print-critical layout.
- Keep barcode rendering isolated in existing barcode components.
- Avoid changing public label data contracts unless required.

### API/Data

- `/api/labels` is the main label API surface.
- `data/labels.json` is the persistent label store.
- Runtime data path should respect `DATA_DIR`.

### Deployment

- Main branch deploys to Vercel.
- Avoid environment-specific assumptions that break Vercel runtime.

## 7. Task Checklist For AI Agents

Before editing:

1. Read this file.
2. Identify the smallest relevant files.
3. Search before opening broad context.
4. Read `docs/BGR-1J_SPECIFICATION.md` only for layout/barcode/print work.

During editing:

1. Change only necessary lines.
2. Preserve interfaces and print dimensions.
3. Avoid unrelated formatting.
4. Avoid new dependencies.

After editing:

1. Run the narrowest useful verification.
2. Mention changed files only.
3. Mention tests/checks run.
4. Keep the final answer concise.
