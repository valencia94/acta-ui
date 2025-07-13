# ACTA-UI Dashboard Visual Representation

**Date:** July 12, 2025  
**Version:** 1.0.0  
**Status:** Production Layout

## 🎨 DASHBOARD VISUAL LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                ACTA-UI HEADER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🏠 ACTA-UI    📊 Dashboard    👤 christian.valencia@ikusi.com    🔄 Logout    │
│                                                                    🛡️ [Admin]   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              WELCOME SECTION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  👋 Welcome back, christian.valencia@ikusi.com!                               │
│  📝 Manage your projects and generate ACTA documents                          │
│                                                                                │
│  Selected Project: [PROJ-001] ◀── Dynamic display                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PROJECT SEARCH SECTION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🔍 Search Project                                                             │
│                                                                                │
│  Project ID: [                    PROJ-001                    ] [🔍 Search]   │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    Actions for Project: PROJ-001                       │  │
│  │                                                                         │  │
│  │  [📋 Copy ID]  [✅ Generate]  [📄 PDF]  [📋 DOCX]  [👁️ Preview]  [📧 Send]  │  │
│  │     ↓             ↓           ↓         ↓          ↓           ↓       │  │
│  │  Clipboard    API Call    Download  Download   Modal      Email       │  │
│  │   Action      Lambda      S3 URL    S3 URL     Popup      Dialog      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               YOUR PROJECTS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  📊 Your Projects                                          Click on a project │
│                                                           to select it       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │  ┌──────┬──────────────────┬─────────────────────┬────────────────────┐  │  │
│  │  │  ID  │      Name        │         PM          │       Status       │  │  │
│  │  ├──────┼──────────────────┼─────────────────────┼────────────────────┤  │  │
│  │  │ 001  │ Project Alpha    │ christian.valencia  │ ●  Active          │  │  │
│  │  │ 002  │ Project Beta     │ christian.valencia  │ ●  Active          │  │  │
│  │  │ 003  │ Project Gamma    │ christian.valencia  │ ●  Active          │  │  │
│  │  │ 004  │ Project Delta    │ christian.valencia  │ ●  Active          │  │  │
│  │  └──────┴──────────────────┴─────────────────────┴────────────────────┘  │  │
│  │                            ↑ Click to select                           │  │
│  │                         Updates selectedProjectId                      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ACTA ACTIONS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ⚡ ACTA Actions                                          Project: PROJ-001    │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         PRIMARY ACTIONS                                 │  │
│  │                                                                         │  │
│  │     ┌─────────────────────────┐    ┌─────────────────────────┐          │  │
│  │     │     📄 Generate         │    │   📧 Send Approval      │          │  │
│  │     │                         │    │                         │          │  │
│  │     │   Creates ACTA doc      │    │   Opens email dialog    │          │  │
│  │     │   via Lambda API        │    │   Sends via SES         │          │  │
│  │     └─────────────────────────┘    └─────────────────────────┘          │  │
│  │                                                                         │  │
│  │                       SECONDARY ACTIONS                                 │  │
│  │                                                                         │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │   │ 📋 Word     │  │ 👁️ Preview   │  │ 📄 PDF      │                   │  │
│  │   │             │  │             │  │             │                   │  │
│  │   │ Download    │  │ Modal       │  │ Download    │                   │  │
│  │   │ DOCX file   │  │ display     │  │ PDF file    │                   │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  💡 Generate first, then preview, download or send for approval               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 COMPONENT BREAKDOWN

### **1. HEADER COMPONENT** (`src/components/Header.tsx`)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Component: Header                                                             │
│  ┌─────────────┬─────────────┬─────────────────────────┬─────────────────────┐ │
│  │    Logo     │ Navigation  │      User Info          │      Actions        │ │
│  │             │             │                         │                     │ │
│  │  🏠 ACTA-UI │ Dashboard   │ christian.valencia@..   │ [🛡️ Admin] [Logout] │ │
│  │             │ Admin (*)   │ Last login: 2 hrs ago   │                     │ │
│  └─────────────┴─────────────┴─────────────────────────┴─────────────────────┘ │
│  (*) Admin button only visible for admin users                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **2. WELCOME SECTION** (`src/pages/Dashboard.tsx` - Lines 195-210)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Component: Welcome Banner                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Data Source: useAuth hook                                              │   │
│  │  ├─ user.email → Display name                                           │   │
│  │  ├─ selectedProjectId → Current selection                               │   │
│  │  └─ Dynamic updates on project selection                                │   │
│  │                                                                         │   │
│  │  State Management:                                                      │   │
│  │  ├─ selectedProjectId: string                                           │   │
│  │  └─ Updates from handleProjectSelect()                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **3. PROJECT SEARCH SECTION** (`src/pages/Dashboard.tsx` - Lines 241-300)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Component: Project Search & Manual Actions                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Input Field:                                                           │   │
│  │  ├─ value={selectedProjectId}                                           │   │
│  │  ├─ onChange={(e) => setSelectedProjectId(e.target.value)}              │   │
│  │  └─ placeholder="Enter project ID (e.g., PROJ-001)"                     │   │
│  │                                                                         │   │
│  │  Action Buttons (Conditional Render):                                   │   │
│  │  {selectedProjectId.trim() && (                                         │   │
│  │    <ActionButtonsContainer>                                             │   │
│  │      ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────┐ │   │
│  │      │ Copy ID     │ Generate    │ PDF         │ DOCX        │ Preview │ │   │
│  │      │ onClick=    │ onClick=    │ onClick=    │ onClick=    │ onClick=│ │   │
│  │      │ copyTo...   │ handleGen.. │ handleDown..│ handleDown..│ handle..│ │   │
│  │      └─────────────┴─────────────┴─────────────┴─────────────┴─────────┘ │   │
│  │      │                         Send Email                              │ │   │
│  │      │                       onClick=handleSendEmail                   │ │   │
│  │      └─────────────────────────────────────────────────────────────────┘ │   │
│  │    </ActionButtonsContainer>                                            │   │
│  │  )}                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **4. PROJECTS TABLE** (`src/components/DynamoProjectsView.tsx`)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Component: DynamoProjectsView                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Data Flow:                                                             │   │
│  │  ├─ useEffect → getProjectsByPM(userEmail, isAdmin)                     │   │
│  │  ├─ API Response → ProjectSummary[]                                     │   │
│  │  ├─ Transform → Project[] for table                                     │   │
│  │  └─ Render → ProjectTable component                                     │   │
│  │                                                                         │   │
│  │  Props Received:                                                        │   │
│  │  ├─ userEmail: string                                                   │   │
│  │  ├─ onProjectSelect: (projectId: string) => void                        │   │
│  │  └─ selectedProjectId: string                                           │   │
│  │                                                                         │   │
│  │  Table Structure (ProjectTable.tsx):                                    │   │
│  │  ┌──────┬──────────────────┬─────────────────┬────────────────────────┐ │   │
│  │  │ ID   │ Name             │ PM              │ Status                 │ │   │
│  │  │ (num)│ (string)         │ (string)        │ (StatusChip)           │ │   │
│  │  ├──────┼──────────────────┼─────────────────┼────────────────────────┤ │   │
│  │  │ 001  │ Project Alpha    │ christian...    │ ● Active               │ │   │
│  │  │ 002  │ Project Beta     │ christian...    │ ● Active               │ │   │
│  │  └──────┴──────────────────┴─────────────────┴────────────────────────┘ │   │
│  │  ↑ onClick → onProjectSelect(row.id.toString())                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **5. ACTA ACTIONS SECTION** (`src/components/ActaButtons/ActaButtons.tsx`)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Component: ActaButtons (Not currently used - Legacy)                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Props Interface:                                                       │   │
│  │  ├─ onGenerate: () => void                                              │   │
│  │  ├─ onDownloadWord: () => void                                          │   │
│  │  ├─ onDownloadPdf: () => void                                           │   │
│  │  ├─ onPreviewPdf: () => void                                            │   │
│  │  ├─ onSendForApproval: () => void                                       │   │
│  │  └─ disabled: boolean                                                   │   │
│  │                                                                         │   │
│  │  Layout Structure:                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    PRIMARY ACTIONS                              │   │   │
│  │  │  ┌─────────────────────┐    ┌─────────────────────┐             │   │   │
│  │  │  │   📄 Generate       │    │ 📧 Send Approval    │             │   │   │
│  │  │  │   (Green gradient)  │    │ (Teal gradient)     │             │   │   │
│  │  │  └─────────────────────┘    └─────────────────────┘             │   │   │
│  │  │                                                                 │   │   │
│  │  │                   SECONDARY ACTIONS                             │   │   │
│  │  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                     │   │   │
│  │  │  │📋 Word  │    │👁️ Preview│    │📄 PDF   │                     │   │   │
│  │  │  │(Border) │    │(Border) │    │(Border) │                     │   │   │
│  │  │  └─────────┘    └─────────┘    └─────────┘                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  Note: This component exists but is not rendered in current Dashboard   │   │
│  │        Actions are handled directly in Dashboard component              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 INTERACTION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

1. PROJECT SELECTION FLOW:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ User types  │ -> │ Input field │ -> │ State update│ -> │ Buttons     │
   │ project ID  │    │ onChange    │    │ selectedID  │    │ enabled     │
   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
   
   OR
   
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ User clicks │ -> │ Table row   │ -> │ onProject   │ -> │ Buttons     │
   │ table row   │    │ onClick     │    │ Select()    │    │ enabled     │
   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

2. ACTION BUTTON FLOW:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ User clicks │ -> │ Button      │ -> │ API Call    │ -> │ Success/    │
   │ action btn  │    │ handler     │    │ to AWS      │    │ Error       │
   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                            │                                       │
                            v                                       v
                   ┌─────────────┐                         ┌─────────────┐
                   │ Loading     │                         │ Toast       │
                   │ state = true│                         │ notification│
                   └─────────────┘                         └─────────────┘

3. DATA REFRESH FLOW:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Page load / │ -> │ useEffect   │ -> │ getProjects │ -> │ Update      │
   │ User refresh│    │ trigger     │    │ ByPM()      │    │ table data  │
   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🎨 VISUAL DESIGN ELEMENTS

### **Color Scheme:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PRIMARY COLORS:                                                               │
│  ├─ Blue (#0066cc)      - Primary actions, links                              │
│  ├─ Green (#00a651)     - Success states, generate button                     │
│  ├─ Teal (#14b8a6)      - Secondary actions, send email                       │
│  ├─ Gray (#6b7280)      - Text, borders, inactive states                      │
│  └─ Red (#e63946)       - Error states, warnings                              │
│                                                                                │
│  GRADIENTS:                                                                    │
│  ├─ Green gradient      - Generate button (from-green-500 to-green-600)       │
│  ├─ Teal gradient       - Send approval (from-teal-500 to-teal-600)          │
│  └─ Blue gradient       - Primary actions hover states                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **Typography:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FONT HIERARCHY:                                                               │
│  ├─ H1: 2xl font-bold    - Page titles                                        │
│  ├─ H2: xl font-semibold - Section headers                                    │
│  ├─ H3: lg font-medium   - Subsection titles                                  │
│  ├─ Body: sm/base        - Regular text                                       │
│  └─ Small: xs            - Helper text, labels                                │
│                                                                                │
│  FONT FAMILY: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **Spacing & Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SPACING SYSTEM (Tailwind):                                                   │
│  ├─ Container padding: px-4 sm:px-6 lg:px-8                                   │
│  ├─ Section margins: mb-8                                                     │
│  ├─ Element spacing: gap-3, gap-4                                             │
│  ├─ Button padding: px-3 py-1.5 (small), px-5 py-3 (large)                  │
│  └─ Border radius: rounded-lg (8px), rounded-xl (12px)                       │
│                                                                                │
│  RESPONSIVE BREAKPOINTS:                                                       │
│  ├─ sm: 640px  - Small tablets                                               │
│  ├─ md: 768px  - Tablets                                                     │
│  ├─ lg: 1024px - Laptops                                                     │
│  └─ xl: 1280px - Desktops                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 ANIMATIONS & INTERACTIONS

### **Framer Motion Animations:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SECTION ANIMATIONS:                                                           │
│  ├─ Welcome: initial={{ opacity: 0, y: 20 }}, delay: 0                       │
│  ├─ Search: initial={{ opacity: 0, y: 20 }}, delay: 0.1                      │
│  ├─ Projects: initial={{ opacity: 0, y: 20 }}, delay: 0.15                   │
│  └─ Actions: initial={{ opacity: 0, y: 20 }}, delay: 0.2                     │
│                                                                                │
│  BUTTON INTERACTIONS:                                                          │
│  ├─ Hover: transform hover:-translate-y-0.5                                   │
│  ├─ Active: transform active:scale-95                                         │
│  ├─ Focus: focus:ring-2 focus:ring-offset-2                                   │
│  └─ Disabled: disabled:opacity-50 disabled:cursor-not-allowed                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 COMPONENT SUMMARY

**Total Components:** 8 main components
**Total Buttons:** 6 action buttons per project
**Data Sources:** 3 (Cognito, DynamoDB, S3)
**API Endpoints:** 5 primary endpoints
**State Variables:** 12 reactive state variables

This visual representation provides a complete picture of the ACTA-UI dashboard layout, showing exactly how users interact with the interface and how data flows through each component.
