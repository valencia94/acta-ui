# Cross Impact Map – UI & API Alignment

This document maps UI routes and service calls to their corresponding API Gateway endpoints and Lambda handlers.

| UI Component/Route       | Service Hook                             | API Endpoint                       | Lambda Function             |
| ------------------------ | ---------------------------------------- | ---------------------------------- | --------------------------- |
| `Dashboard.tsx`          | `getSummary(id)`                         | `GET /project-summary/{id}`        | `getProjectSummary`         |
|                          | `getTimeline(id)`                        | `GET /timeline/{id}`               | `getTimeline`               |
|                          | `getDownloadUrl(id, fmt)`                | `GET /download-acta/{id}?format=`  | `getDownloadActa`           |
|                          | `sendApprovalEmail(payload)`             | `POST /send-approval-email`        | `sendApprovalEmail`         |
|                          | `extractProjectData(id)`                 | `POST /extract-project-place/{id}` | `ProjectPlaceDataExtractor` |
| `GenerateActaButton.tsx` | `sendApprovalEmail(actaId, clientEmail)` | `POST /send-approval-email`        | `sendApprovalEmail`         |
| `/health` (static file)  | N/A                                      | `GET /health`                      | `healthCheck`               |

### Base URL Injection

All network calls rely on `VITE_API_BASE_URL` from `env.variables.ts`, ensuring the correct backend host is used in development and CI.

### Notes

- No legacy routes like `/generateDocument` or `/approve` exist in the codebase.
- Playwright tests set `VITE_SKIP_AUTH=true` to bypass Cognito during CI.
