# ACTA API Gateway CORS Fix (Quick Ops Guide)

Use this when browsers show "Preflight didn't succeed" or blocked CORS on endpoints like `/check-document/{id}`, `/download-acta/{id}`, `/preview-pdf/{id}`, or `/send-approval-email`.

## 1) Apply OPTIONS (no redirects, 200 OK)
This script creates/updates OPTIONS with a MOCK integration that always returns `200` and the correct CORS headers.

```bash
# Optionally override values via env
export API_ID=q2b9avfwv5
export STAGE=prod
export REGION=us-east-2
export ORIGIN=https://d7t9x3j66yd8k.cloudfront.net

bash infra/api-gw-cors.sh
```

## 2) Verify
Use the included verifier to test OPTIONS and GET responses quickly.

```bash
bash infra/verify-cors.sh "https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE" 1000000055914011
```

Expected: OPTIONS returns 200 and includes:
- `Access-Control-Allow-Origin: <your app origin>`
- `Access-Control-Allow-Methods: GET,POST,OPTIONS,HEAD,PUT,DELETE`
- `Access-Control-Allow-Headers: Authorization,Content-Type`
- No redirects on OPTIONS

## 3) Retry from ACTA UI
- Refresh the UI and retry Generate, Download, Preview, and Send Approval.
- Use `/public/cors-inspector.html` at your deployed site to check endpoints visually.

## Notes
- OPTIONS must return 2xx and not redirect. Redirected preflights are blocked by browsers.
- Your actual GET/POST Lambda responses should also echo `Access-Control-Allow-Origin`.
- If you front with CloudFront, ensure that the Origin request/response behavior does not strip CORS headers.
