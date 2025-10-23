# DotProject Development Guide

## Package Manager Policy

**ALWAYS use pnpm instead of npm for all Node.js package management operations.** This ensures consistency across the project and avoids potential issues with lockfile conflicts.

- ✅ Use `pnpm install`, `pnpm run`, `pnpm build`, etc.
- ❌ Never use `npm install`, `npm run`, `npm build`, etc.

## Important Notes

- Always use `pnpm run restart` instead of manually stopping/starting services
- Check logs with `pnpm run logs` when troubleshooting
- **ALWAYS use pnpm for all Node.js package management operations**