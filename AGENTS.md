# 🤖 Agents Manifest – Acta Platform

Each agent is a serverless function responsible for a single piece of the Acta workflow. These lambdas are wired up to API Gateway endpoints defined in `infra/template.yaml`.

---

## 1. getTimeline

**Type:** Lambda
**Trigger:** `GET /timeline/{id}`
**Purpose:** Returns milestone and delivery history for a project
**Input Path Param:** `id` = Project ID
**Returns:**
```json
[
  {
    "hito": "Kickoff",
    "actividades": "Setup",
    "fecha": "2024-01-01"
  }
]
```

---

## 2. getProjectSummary

**Type:** Lambda
**Trigger:** `GET /project-summary/{id}`
**Purpose:** Returns project title, client email and PM name. Used to populate the Acta header and recipient info.

---

## 3. sendApprovalEmail

**Type:** Lambda
**Trigger:** `POST /send-approval-email`
**Payload:**
```json
{
  "actaId": "abc123",
  "clientEmail": "client@example.com"
}
```
**Purpose:** Sends an Acta email with approve/reject buttons. Tracks the decision in DynamoDB for audit.

---

## 4. getDownloadActa

**Type:** Lambda
**Trigger:** `GET /download-acta/{id}?format=pdf|docx`
**Purpose:** Returns the signed Acta in the requested format via a 302 redirect to an S3 link.

---

## 5. ProjectPlaceDataExtractor

**Type:** Lambda
**Trigger:** `POST /extract-project-place/{id}`
**Purpose:** Pulls cards and comments from a ProjectPlace board. Can trigger the Acta re‑generation pipeline.

---

## 6. healthCheck

**Type:** Lambda
**Trigger:** `GET /health`
**Purpose:** CloudFront and CI monitoring probe.
**Returns:** `{ "status": "ok" }`

---

### 🔄 Future Extensions

This manifest can be extended with additional event triggers (e.g. S3 uploads, DynamoDB streams), retry/backoff policies, structured logging expectations, or internal Slack bot agents. Codex agents may also be added for AI-assisted workflows.

