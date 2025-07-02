# ACTA UI - How to Use the Generate and Download Workflow

## Overview

The ACTA UI provides a complete workflow for generating and downloading project documentation (Acta) in both Word (.docx) and PDF formats. This document explains how the workflow operates and how to use each feature effectively.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ACTA UI       │    │  API Gateway    │    │  Lambda + S3    │
│  (Dashboard)    │───▶│   (Backend)     │───▶│   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **UI Dashboard** → Makes API calls to backend
2. **API Gateway** → Routes requests to appropriate Lambda functions
3. **Lambda Functions** → Fetch external data, generate documents, store in S3
4. **S3 Bucket** → `projectplace-dv-2025-x9a7b` stores generated DOCX files
5. **Daily Jobs** → Automatically generate/update documents for active projects

## Button Functions

### 1. 🟢 Generate Button

**Purpose**: Creates a fresh Acta document with the latest project data

**What it does**:

- Triggers Lambda function to fetch fresh external project data
- Processes the data and generates a new DOCX document
- Stores the document in S3 bucket (`projectplace-dv-2025-x9a7b`)
- Takes several minutes due to external data fetching

**When to use**:

- When you need the most current project information
- Before important meetings or reviews
- When project data has recently changed

**User Experience**:

- Shows progress message: "Starting Acta generation... This may take a few minutes"
- Displays success message when complete
- Automatically refreshes the project list

### 2. 📤 Send Approval Button

**Purpose**: Sends the Acta document to stakeholders for approval

**What it does**:

- Sends an email with the Acta document to the specified recipients
- Uses the most recently generated document
- Includes approval workflow links/tokens

**Prerequisites**:

- A document must exist (either generated manually or by daily jobs)
- Valid email addresses must be configured

### 3. 📄 Word Download Button

**Purpose**: Downloads the Acta document in Microsoft Word format (.docx)

**What it does**:

- Fetches a signed URL from the S3 bucket
- Opens the download in a new browser tab
- Downloads the native DOCX format for editing

**When to use**:

- When you need to edit or modify the document
- For sharing with stakeholders who prefer Word format
- For further customization or formatting

### 4. 📕 PDF Download Button

**Purpose**: Downloads the Acta document in PDF format

**What it does**:

- Fetches a signed URL for the PDF version
- Opens the download in a new browser tab
- Provides a read-only, formatted version

**When to use**:

- For final distribution and sharing
- When formatting preservation is important
- For archival purposes

## Typical Usage Workflows

### Workflow 1: Generate Fresh Document

```
1. Enter Project ID
2. Click "Generate" → Wait 2-5 minutes
3. Click "Word" or "PDF" → Download immediately
4. Optional: Click "Send Approval" → Email to stakeholders
```

### Workflow 2: Use Existing Document (from Daily Jobs)

```
1. Enter Project ID
2. Click "Word" or "PDF" → Download existing document
3. Optional: If document doesn't exist → Click "Generate" first
```

### Workflow 3: Full Approval Process

```
1. Generate fresh document
2. Download Word version for review
3. Make any necessary edits offline
4. Generate final version if changes were made
5. Send for approval via email
6. Download PDF for final distribution
```

## Error Handling and Troubleshooting

### Common Scenarios

**"Project ID not found"**

- Verify the Project ID is correct and exists in the external system
- Check if the project is active and accessible

**"No document found for download"**

- Click "Generate" button first to create the document
- Wait for generation to complete before downloading

**"Authentication failed"**

- Sign out and sign back in
- Check if your permissions are correct

**"External data source unavailable"**

- The external project management system may be down
- Try again in a few minutes
- Contact IT support if the issue persists

### Best Practices

1. **Always generate fresh documents before important meetings**
2. **Test downloads after generation to ensure success**
3. **Use specific, descriptive Project IDs**
4. **Keep the dashboard open during generation (don't navigate away)**
5. **Download both Word and PDF versions for different use cases**

## Technical Details

### API Endpoints Used

- `POST /extract-project-place/{projectId}` → Generate document
- `GET /download-acta/{projectId}?format=docx` → Download Word
- `GET /download-acta/{projectId}?format=pdf` → Download PDF
- `POST /send-approval-email` → Send approval emails

### S3 Storage

- Bucket: `projectplace-dv-2025-x9a7b`
- Documents stored with project-specific naming
- Signed URLs provided for secure downloads
- Automatic cleanup of old documents

### Daily Jobs

- Run automatically to keep documents current
- Generate documents for active projects
- Reduce need for manual generation in most cases

## Development and Debugging

### Console Testing

The dashboard includes built-in testing utilities accessible via browser console:

```javascript
// Test all dashboard buttons
testDashboardButtons();

// Test API connectivity
testAPIConnectivity();

// Debug environment configuration
debugEnvironment();

// Test React event handlers
testReactEventHandlers();
```

### Environment Variables

- `VITE_API_BASE_URL` → Must point to correct API Gateway endpoint
- Production: Set in GitHub secrets/environment
- Development: Set in `.env` file

## Support and Maintenance

### Monitoring

- Check CloudWatch logs for Lambda execution
- Monitor S3 bucket for document creation
- Review API Gateway metrics for request success rates

### Updates

- UI updates deployed via GitHub Actions
- Backend updates require separate Lambda deployment
- S3 bucket policies and permissions managed separately

---

_For technical support or feature requests, contact the development team or create an issue in the project repository._
