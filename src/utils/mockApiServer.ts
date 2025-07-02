// src/utils/mockApiServer.ts
// Mock API responses for development mode when backend is not available

export interface MockApiResponse {
  [key: string]: any;
}

// Mock project data
const mockProjects = [
  {
    id: '1000000064013473',
    name: 'Infrastructure Upgrade Phase 1',
    pm_email: 'admin@ikusi.com',
    status: 'active',
    updated_at: new Date().toISOString(),
    acta_status: 'available'
  },
  {
    id: '1000000049842296', 
    name: 'Network Security Enhancement',
    pm_email: 'admin@ikusi.com',
    status: 'active',
    updated_at: new Date().toISOString(),
    acta_status: 'pending'
  },
  {
    id: '1000000055667788',
    name: 'Digital Transformation Initiative', 
    pm_email: 'admin@ikusi.com',
    status: 'active',
    updated_at: new Date().toISOString(),
    acta_status: 'available'
  }
];

// Mock API responses
export const mockApiResponses: Record<string, MockApiResponse> = {
  // Health check
  '/health': {
    status: 'healthy',
    message: 'Mock API server is running',
    timestamp: new Date().toISOString()
  },

  // Projects endpoints
  '/projects': mockProjects,
  '/projects-by-pm': mockProjects,
  
  // Project specific endpoints
  '/project/1000000064013473': mockProjects[0],
  '/project/1000000049842296': mockProjects[1], 
  '/project/1000000055667788': mockProjects[2],
  
  // Extract project data (new)
  '/extract-project-place/1000000064013473': {
    success: true,
    message: 'Project data extracted successfully',
    projectData: {
      id: '1000000064013473',
      name: 'Infrastructure Upgrade Phase 1',
      pm_email: 'admin@ikusi.com',
      description: 'Major infrastructure upgrade for improved reliability',
      status: 'active',
      budget: 150000,
      phases: ['Planning', 'Implementation', 'Testing']
    }
  },
  '/extract-project-place/1000000049842296': {
    success: true,
    message: 'Project data extracted successfully',
    projectData: {
      id: '1000000049842296',
      name: 'Network Security Enhancement',
      pm_email: 'admin@ikusi.com',
      description: 'Comprehensive security upgrade for network infrastructure',
      status: 'active',
      budget: 75000,
      phases: ['Assessment', 'Implementation', 'Validation']
    }
  },
  '/extract-project-place/1000000055667788': {
    success: true,
    message: 'Project data extracted successfully',
    projectData: {
      id: '1000000055667788',
      name: 'Digital Transformation Initiative',
      pm_email: 'admin@ikusi.com',
      description: 'Digital modernization across all business units',
      status: 'active',
      budget: 200000,
      phases: ['Analysis', 'Design', 'Implementation', 'Migration']
    }
  },
  
  // Document generation
  '/generate-document': {
    success: true,
    message: 'Document generated successfully (mock)',
    documentId: 'mock-doc-' + Date.now(),
    s3Key: 'acta-documents/mock-document.docx'
  },
  
  // PDF operations
  '/convert-to-pdf': {
    success: true,
    message: 'Document converted to PDF (mock)',
    pdfKey: 'acta-documents/mock-document.pdf'
  },
  
  // Download URLs
  '/download-url': {
    url: 'https://mock-s3-bucket.s3.amazonaws.com/mock-document.pdf?mock=true',
    expiresIn: 3600
  },
  
  // Email operations
  '/send-approval-email': {
    success: true,
    message: 'Approval email sent successfully (mock)',
    emailId: 'mock-email-' + Date.now()
  },
  
  // S3 operations
  '/check-s3-document': {
    exists: true,
    lastModified: new Date().toISOString(),
    size: 125000 // 125KB mock size
  },

  // Missing endpoints for Generate workflow
  '/extract-project-place': {
    success: true,
    message: 'Project place extracted successfully (mock)',
    projectPlace: 'Madrid, Spain',
    extractedAt: new Date().toISOString()
  }
};

/**
 * Check if we should use mock API responses
 */
export function shouldUseMockApi(): boolean {
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
  const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
  
  return skipAuth || useMockApi;
}

/**
 * Get mock response for a given endpoint
 */
export function getMockResponse(endpoint: string, method: string = 'GET'): MockApiResponse | null {
  // Normalize endpoint - remove query params for matching
  const cleanEndpoint = endpoint.split('?')[0];
  
  // Try exact match first
  if (mockApiResponses[cleanEndpoint]) {
    return mockApiResponses[cleanEndpoint];
  }
  
  // Try pattern matching for dynamic endpoints
  if (cleanEndpoint.match(/^\/project\/\d+$/)) {
    const projectId = cleanEndpoint.split('/').pop();
    const project = mockProjects.find(p => p.id === projectId);
    return project || { error: 'Project not found' };
  }
  
  // Handle extract-project-place endpoints
  if (cleanEndpoint.match(/^\/extract-project-place\/\d+$/)) {
    const projectId = cleanEndpoint.split('/').pop();
    const extractEndpoint = `/extract-project-place/${projectId}`;
    if (mockApiResponses[extractEndpoint]) {
      return mockApiResponses[extractEndpoint];
    }
    // Default extract response
    return {
      success: true,
      message: 'Project data extracted successfully',
      projectData: {
        id: projectId,
        name: `Mock Project ${projectId}`,
        pm_email: 'admin@ikusi.com',
        description: `Mock project data for ${projectId}`,
        status: 'active',
        budget: 100000,
        phases: ['Planning', 'Implementation', 'Testing']
      }
    };
  }
  
  // Handle projects by PM email
  if (cleanEndpoint === '/projects-by-pm') {
    return mockProjects;
  }
  
  return null;
}

/**
 * Mock API interceptor function
 */
export async function mockApiInterceptor<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  if (!shouldUseMockApi()) {
    throw new Error('Mock API not enabled');
  }
  
  const method = options?.method || 'GET';
  const endpoint = url.replace(/^.*\/api/, ''); // Remove base URL
  
  console.log(`🎭 Mock API: ${method} ${endpoint}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  const mockResponse = getMockResponse(endpoint, method);
  
  if (mockResponse) {
    console.log(`✅ Mock API response:`, mockResponse);
    return mockResponse as T;
  }
  
  // Default error response
  console.warn(`⚠️ No mock response for: ${method} ${endpoint}`);
  throw new Error(`Mock API: No response configured for ${method} ${endpoint}`);
}

/**
 * Enhanced mock for specific operations
 */
export const mockOperations = {
  generateDocument: async (projectId: string) => {
    console.log(`🎭 Mock: Generating document for project ${projectId}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
    return {
      success: true,
      message: `Document generated for project ${projectId}`,
      documentPath: `acta-documents/project-${projectId}-acta.docx`,
      generatedAt: new Date().toISOString()
    };
  },
  
  sendApprovalEmail: async (projectId: string, recipientEmail: string) => {
    console.log(`🎭 Mock: Sending approval email for project ${projectId} to ${recipientEmail}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: `Approval email sent to ${recipientEmail}`,
      emailId: `mock-email-${Date.now()}`,
      sentAt: new Date().toISOString()
    };
  },
  
  convertToPdf: async (documentPath: string) => {
    console.log(`🎭 Mock: Converting document to PDF: ${documentPath}`);
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      success: true,
      pdfPath: documentPath.replace('.docx', '.pdf'),
      convertedAt: new Date().toISOString()
    };
  }
};
