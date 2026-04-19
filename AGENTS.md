# AGENTS.md - Rechords

See [README.md](README.md) for install and run commands.

## Commands

```bash
cd app
meteor                                   # run app
npm run pretty:write                      # format
npm run ci:test                          # lint + all tests (headless)
```

## Workflow

1. Make changes
2. Format: `npm run pretty:write`
3. Run tests at END: `npm run ci:test`
4. Run tests at END: `npm run ci:test:e2e`

## Testing Frontend

Use Chrome MCP against http://localhost:3000 (from `opencode.jsonc`):
- `chrome-devtools_click`, `chrome-devtools_take_snapshot`, etc.

## Gotchas

- LESS mixin deprecation warnings are cosmetic
- Run `npm run ci:test` at END of session