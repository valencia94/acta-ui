# Build Release Documentation

## Final Checklist

| Item               | Configured |
| ------------------ | ---------- |
| API Gateway routes | Configured |
| Dashboard buttons  | Configured |
| Login branding     | Configured |
| CI pipeline        | Configured |

## Requirements Summary

- Dashboard must display project details, timeline history and provide
  download links for the signed Acta document.
- Approval emails are triggered via the `sendApprovalEmail` Lambda.
- GitHub Actions workflow [`build_deploy.yml`](../.github/workflows/build_deploy.yml)
  builds and deploys the UI to S3/CloudFront.

Refer to [cross-impact-map.md](./cross-impact-map.md) for a detailed mapping
between UI components and API routes.
