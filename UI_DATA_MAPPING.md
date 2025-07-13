# ACTA-UI Data Mapping Documentation

**Date:** July 12, 2025  
**Version:** 1.0.0  
**Status:** Production Ready

## 📊 EXECUTIVE SUMMARY

This document provides a comprehensive mapping of how data flows through the ACTA-UI application, from user interactions in the interface to backend AWS services and database operations.

## 🎯 DATA FLOW ARCHITECTURE

```
User Interface → React Components → API Layer → AWS Services → Database
     ↓              ↓                ↓           ↓            ↓
   Dashboard    → useAuth Hook   → API Gateway → Lambda    → DynamoDB
   Buttons      → State Mgmt     → JWT Auth    → S3        → Cognito
   Forms        → Error Handling → CORS        → SES       → CloudFront
```

## 🔧 UI COMPONENT DATA MAPPING

### **1. AUTHENTICATION FLOW**

#### **Login Page** (`src/pages/Login.tsx`)
```typescript
// Data Input
interface LoginData {
  email: string;          // User email input
  password: string;       // User password input
}

// Data Flow
Login Form → useAuth Hook → Cognito User Pool → JWT Token → Global State
```

**Data Mapping:**
- **Input Fields**: `email`, `password`
- **Validation**: Email format, password requirements
- **Processing**: Cognito authentication via AWS Amplify
- **Output**: JWT token, user session, redirect to dashboard
- **Error Handling**: Invalid credentials, network errors
- **State Management**: Authentication context, loading states

#### **useAuth Hook** (`src/hooks/useAuth.tsx`)
```typescript
// Authentication State
interface AuthState {
  user: {
    email: string;
    sub: string;           // Cognito user ID
    groups?: string[];     // User groups (admin, etc.)
  } | null;
  loading: boolean;
  error: string | null;
}

// Data Operations
- signIn(email, password) → Cognito User Pool
- signOut() → Clear session
- getCurrentUser() → Fetch user data
- checkAuthState() → Validate session
```

### **2. DASHBOARD COMPONENTS**

#### **Main Dashboard** (`src/pages/Dashboard.tsx`)

**Project Data State:**
```typescript
interface ProjectData {
  project_id: string;         // Primary key
  project_name: string;       // Display name
  pm: string;                 // Project manager email
  project_manager: string;    // Alternative PM field
  planet?: string;            // Project location
  title?: string;             // Project title
}

interface DashboardState {
  projects: ProjectData[];          // All projects
  selectedProjectId: string;       // Currently selected project
  loading: boolean;                 // Loading state
  error: string | null;             // Error messages
  actionLoading: Record<string, boolean>; // Button loading states
}
```

**Data Sources:**
- **Primary**: DynamoDB via `getProjectsByPM(userEmail, isAdmin)`
- **Authentication**: JWT token from Cognito
- **Filtering**: PM email-based project filtering
- **Real-time**: Manual refresh, no auto-refresh

#### **Project Search & Selection**
```typescript
// Search Input
searchInput: string → selectedProjectId: string

// Data Flow
Search Input → State Update → Highlight Project → Enable Action Buttons
```

#### **Action Buttons Data Flow**

**1. Copy ID Button**
```typescript
// Data Flow
selectedProjectId → navigator.clipboard.writeText() → Toast Notification

// No API call - pure client-side operation
```

**2. Generate Document Button**
```typescript
// Input Data
{
  projectId: string;          // Selected project ID
  userEmail: string;          // Current user email
  userRole: 'pm' | 'admin';   // User role
}

// API Call
handleGenerateDocument(projectId) → generateActaDocument(projectId, userEmail, 'pm')

// Data Flow
Button Click → API Gateway → Lambda Function → Document Generation → S3 Storage
```

**3. Download PDF/DOCX Buttons**
```typescript
// Input Data
{
  projectId: string;          // Selected project ID
  format: 'pdf' | 'docx';     // Document format
}

// API Call
handleDownload(projectId, format) → getS3DownloadUrl(projectId, format)

// Data Flow
Button Click → API Gateway → Lambda Function → S3 Presigned URL → Browser Download
```

**4. Preview Button**
```typescript
// Input Data
{
  projectId: string;          // Selected project ID
  format: 'pdf';              // Always PDF for preview
}

// API Call
handlePreview() → getS3DownloadUrl(projectId, 'pdf') → setPdfPreviewUrl()

// Data Flow
Button Click → API Gateway → S3 URL → PDF Modal → Iframe Display
```

**5. Send Email Button**
```typescript
// Input Data
{
  projectId: string;          // Selected project ID
  recipientEmail: string;     // User input from dialog
  documentUrl: string;        // Generated document URL
}

// API Call
handleSendEmail(projectId, recipientEmail) → sendApprovalEmail(projectId, recipientEmail)

// Data Flow
Button Click → Email Dialog → API Gateway → Lambda Function → SES → Email Sent
```

### **3. ADMIN DASHBOARD** (`src/pages/AdminDashboard.tsx`)

**Admin-Specific Data:**
```typescript
interface AdminState {
  isAdmin: boolean;           // Admin access flag
  allProjects: ProjectData[]; // All projects (not filtered)
  systemStats: {
    totalProjects: number;
    activeProjects: number;
    documentsGenerated: number;
  };
}

// Data Sources
- getAllProjects() → All projects from DynamoDB
- Admin-specific API endpoints
- System metrics and statistics
```

### **4. PROJECT MANAGEMENT** (`src/components/DynamoProjectsView.tsx`)

**Project Display Data:**
```typescript
interface ProjectTableData {
  id: number;                 // Converted from project_id
  name: string;               // project_name
  pm: string;                 // project_manager or pm
  status: 'Active' | 'Inactive'; // Derived status
}

// Data Transformation
ProjectSummary[] → ProjectTableData[]
- project_id (string) → id (number)
- project_name → name
- pm || project_manager → pm
- Default status: 'Active'
```

## 🌐 API LAYER DATA MAPPING

### **API Functions** (`src/lib/api.ts`)

#### **1. Project Data APIs**
```typescript
// Get Projects by PM
getProjectsByPM(pmEmail: string, isAdmin: boolean = false) → ProjectSummary[]
- Endpoint: /api/pm-manager/all-projects
- Method: GET
- Headers: Authorization (JWT), Content-Type
- Response: Array of project objects

// Get All Projects (Admin)
getAllProjects() → ProjectSummary[]
- Endpoint: /api/projects
- Method: GET
- Headers: Authorization (JWT), Content-Type
- Response: Array of all project objects
```

#### **2. Document Generation APIs**
```typescript
// Generate ACTA Document
generateActaDocument(projectId: string, userEmail: string, userRole: string) → {
  success: boolean;
  message: string;
  s3Location?: string;
  documentUrl?: string;
}
- Endpoint: /api/generate-acta
- Method: POST
- Body: { projectId, userEmail, userRole }
- Response: Generation result with S3 location

// Get Download URL
getS3DownloadUrl(projectId: string, format: 'pdf' | 'docx') → {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}
- Endpoint: /api/download-acta/{projectId}
- Method: GET
- Query: format=pdf|docx
- Response: Presigned S3 URL
```

#### **3. Email APIs**
```typescript
// Send Approval Email
sendApprovalEmail(projectId: string, recipientEmail: string) → {
  success: boolean;
  message: string;
  error?: string;
}
- Endpoint: /api/send-approval-email
- Method: POST
- Body: { projectId, recipientEmail }
- Response: Email sending result
```

## 🔐 AUTHENTICATION DATA FLOW

### **JWT Token Management**
```typescript
// Token Storage
localStorage.setItem('accessToken', token)
localStorage.setItem('refreshToken', refreshToken)

// Token Usage
Headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}

// Token Refresh
- Automatic refresh on 401 responses
- Refresh token rotation
- Logout on refresh failure
```

### **User Session Data**
```typescript
interface UserSession {
  accessToken: string;        // JWT access token
  refreshToken: string;       // JWT refresh token
  idToken: string;            // Cognito ID token
  user: {
    email: string;            // User email
    sub: string;              // Cognito user ID
    groups?: string[];        // User groups
  };
  expiresAt: number;          // Token expiration
}
```

## 📊 DATABASE MAPPING

### **DynamoDB Table Structure**
```typescript
// Primary Table: ProjectPlace_DataExtrator_landing_table_v2
interface DynamoDBRecord {
  project_id: string;         // Partition key
  project_name: string;       // Project name
  pm?: string;                // Project manager
  project_manager?: string;   // Alternative PM field
  planet?: string;            // Project location
  title?: string;             // Project title
  created_at?: string;        // Creation timestamp
  updated_at?: string;        // Last update timestamp
}

// Query Patterns
- Scan all records (admin view)
- Filter by PM email (regular user view)
- Get single record by project_id
```

### **S3 Storage Structure**
```typescript
// Document Storage Bucket: projectplace-dv-2025-x9a7b
Structure:
├── documents/
│   ├── {project_id}/
│   │   ├── acta.pdf
│   │   ├── acta.docx
│   │   └── metadata.json
│   └── templates/
│       ├── default.pdf
│       └── default.docx
└── temp/
    └── {session_id}/
        └── working_files/
```

## 🎨 UI STATE MANAGEMENT

### **React State Architecture**
```typescript
// Component State Hierarchy
App
├── AuthProvider (Global auth state)
├── Router
├── Dashboard
│   ├── ProjectsView (Project data)
│   ├── ActionButtons (Button states)
│   └── PDFPreview (Modal state)
└── AdminDashboard
    ├── AdminProjectsView (All projects)
    └── SystemStats (Admin data)
```

### **State Updates Flow**
```typescript
// User Action → State Update → UI Re-render → API Call → State Update
Click Generate → actionLoading[generate-{id}] = true → Button disabled → API call → Success/Error → actionLoading[generate-{id}] = false
```

## 🔄 ERROR HANDLING DATA FLOW

### **Error Types & Handling**
```typescript
interface ErrorState {
  type: 'network' | 'auth' | 'validation' | 'server';
  message: string;
  code?: string;
  details?: any;
}

// Error Flow
API Error → Error Boundary → Toast Notification → User Feedback → Optional Retry
```

### **Loading States**
```typescript
interface LoadingStates {
  globalLoading: boolean;     // Page-level loading
  actionLoading: Record<string, boolean>; // Per-action loading
  dataLoading: boolean;       // Data fetching loading
}
```

## 🚀 PERFORMANCE OPTIMIZATIONS

### **Data Caching**
```typescript
// API Response Caching
- Project data: 5 minutes
- Document URLs: 1 hour
- User session: Until expiry

// Component Optimization
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
```

### **Lazy Loading**
```typescript
// Code Splitting
const PDFPreview = lazy(() => import('@/components/PDFPreview'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

// Data Loading
- Initial load: Essential data only
- On-demand: Additional data as needed
```

## 📝 DATA VALIDATION

### **Client-Side Validation**
```typescript
// Form Validation
- Email format validation
- Required field validation
- Input length limits
- Type checking

// Data Sanitization
- XSS prevention
- SQL injection prevention
- Input escaping
```

### **Server-Side Validation**
```typescript
// API Validation
- JWT token validation
- Permission checks
- Input validation
- Rate limiting
```

## 🎯 MONITORING & ANALYTICS

### **Data Tracking**
```typescript
// User Actions
- Button clicks
- API calls
- Error occurrences
- Performance metrics

// System Metrics
- Response times
- Error rates
- User sessions
- Document generation stats
```

---

## 📊 SUMMARY

This UI data mapping provides a complete picture of how data flows through the ACTA-UI application, ensuring all components are properly connected and data is handled consistently throughout the system.

**Key Data Flows:**
- ✅ Authentication: Login → Cognito → JWT → Global State
- ✅ Project Data: DynamoDB → API → React State → UI Display
- ✅ Document Actions: UI → API → Lambda → S3 → User Download
- ✅ Email Workflow: UI → API → Lambda → SES → Email Delivery

**Data Integrity:**
- ✅ Proper error handling at all levels
- ✅ Loading states for all async operations
- ✅ Input validation and sanitization
- ✅ Secure token management

**Performance:**
- ✅ Optimized data fetching
- ✅ Efficient state management
- ✅ Proper caching strategies
- ✅ Lazy loading for large components
