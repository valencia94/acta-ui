# Changelog

## [Unreleased]
### Fixed
- Simplified `generateActaDocument` payload to required fields only.
- Switched document availability check to `HEAD /document-validator` and surfaced toast on missing documents.
- Normalized S3 paths to `acta-documents/` prefix and improved download resolution.

### Testing
- `pnpm exec eslint . --fix`
- `pnpm exec tsc --noEmit`
- `pnpm run build`
- `pnpm test`
