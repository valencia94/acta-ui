/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Dashboard from '../../pages/Dashboard';

// Mock all external dependencies
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com' },
    loading: false,
  })),
}));

vi.mock('../../lib/api', () => ({
  generateActaDocument: vi.fn(),
  getDownloadUrl: vi.fn(),
  checkDocumentInS3: vi.fn(),
  sendApprovalEmail: vi.fn(),
}));

vi.mock('../../components/DynamoProjectsView', () => ({
  default: ({ onProjectSelect }: { onProjectSelect: (id: string) => void }) => (
    <div data-testid="projects-view">
      <button
        data-testid="project-button"
        onClick={() => onProjectSelect('test-project-001')}
      >
        Select Test Project
      </button>
    </div>
  ),
}));

vi.mock('../../components/ActaButtons/ActaButtons', () => ({
  default: ({
    onGenerate,
    onDownloadPdf,
    onDownloadWord,
    onPreviewPdf,
    onSendForApproval,
    disabled,
    isGenerating,
    isDownloadingPdf,
    isDownloadingWord,
    isPreviewingPdf,
    isSendingApproval,
  }: any) => (
    <div data-testid="acta-buttons">
      <button
        data-testid="generate-button"
        onClick={onGenerate}
        disabled={disabled}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
      <button
        data-testid="download-pdf-button"
        onClick={onDownloadPdf}
        disabled={disabled}
      >
        {isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}
      </button>
      <button
        data-testid="download-word-button"
        onClick={onDownloadWord}
        disabled={disabled}
      >
        {isDownloadingWord ? 'Downloading Word...' : 'Download Word'}
      </button>
      <button
        data-testid="preview-button"
        onClick={onPreviewPdf}
        disabled={disabled}
      >
        {isPreviewingPdf ? 'Previewing...' : 'Preview'}
      </button>
      <button
        data-testid="send-approval-button"
        onClick={onSendForApproval}
        disabled={disabled}
      >
        {isSendingApproval ? 'Sending...' : 'Send Approval'}
      </button>
    </div>
  ),
}));

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/PDFPreview', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="pdf-preview">
        <button data-testid="close-preview" onClick={onClose}>
          Close Preview
        </button>
      </div>
    ) : null,
}));

vi.mock('../../components/EmailInputDialog', () => ({
  EmailInputDialog: ({ isOpen, onClose, onSubmit, loading }: any) =>
    isOpen ? (
      <div data-testid="email-dialog">
        <input data-testid="email-input" />
        <button
          data-testid="submit-email"
          onClick={() => onSubmit('client@example.com')}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
        <button data-testid="close-dialog" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('../../components/ResponsiveIndicator', () => ({
  default: () => <div data-testid="responsive-indicator">Responsive</div>,
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(() =>
    Promise.resolve({
      credentials: { identityId: 'test-identity' },
    })
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard with all sections', () => {
    render(<Dashboard />);

    expect(screen.getByText(/Welcome, test@example.com/)).toBeInTheDocument();
    expect(screen.getByText('Your Projects')).toBeInTheDocument();
    expect(screen.getByText('ACTA Actions')).toBeInTheDocument();
    expect(screen.getByTestId('projects-view')).toBeInTheDocument();
    expect(screen.getByTestId('acta-buttons')).toBeInTheDocument();
  });

  it('allows project selection and shows success toast', async () => {
    render(<Dashboard />);

    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Selected project: test-project-001',
        expect.objectContaining({
          duration: 2000,
          icon: '✅',
        })
      );
    });
  });

  it('handles generate ACTA action successfully', async () => {
    const { generateActaDocument } = require('../../lib/api');
    generateActaDocument.mockResolvedValue({});

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click generate
    const generateButton = screen.getByTestId('generate-button');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateActaDocument).toHaveBeenCalledWith(
        'test-project-001',
        'test@example.com',
        'pm'
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "ACTA generation started successfully! You'll receive an email when ready.",
        expect.objectContaining({
          duration: 5000,
          icon: '✅',
        })
      );
    });
  });

  it('handles generate ACTA action failure', async () => {
    const { generateActaDocument } = require('../../lib/api');
    generateActaDocument.mockRejectedValue(new Error('Generation failed'));

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click generate
    const generateButton = screen.getByTestId('generate-button');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Generation failed',
        expect.objectContaining({
          duration: 4000,
          icon: '❌',
        })
      );
    });
  });

  it('prevents actions when no project is selected', async () => {
    render(<Dashboard />);

    const generateButton = screen.getByTestId('generate-button');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please select a project and ensure you're logged in."
      );
    });
  });

  it('handles PDF download successfully', async () => {
    const { getDownloadUrl } = require('../../lib/api');
    getDownloadUrl.mockResolvedValue('https://example.com/download-url');

    // Mock window.open
    const mockOpen = vi.fn();
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockOpen,
    });

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click download PDF
    const downloadButton = screen.getByTestId('download-pdf-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(getDownloadUrl).toHaveBeenCalledWith('test-project-001', 'pdf');
    });

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        'https://example.com/download-url',
        '_blank'
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'PDF download started successfully!',
        expect.objectContaining({
          duration: 3000,
          icon: '📥',
        })
      );
    });
  });

  it('handles Word download successfully', async () => {
    const { getDownloadUrl } = require('../../lib/api');
    getDownloadUrl.mockResolvedValue('https://example.com/download-url');

    // Mock window.open
    const mockOpen = vi.fn();
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockOpen,
    });

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click download Word
    const downloadButton = screen.getByTestId('download-word-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(getDownloadUrl).toHaveBeenCalledWith('test-project-001', 'docx');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'DOCX download started successfully!',
        expect.objectContaining({
          duration: 3000,
          icon: '📥',
        })
      );
    });
  });

  it('handles preview successfully when document is available', async () => {
    const { checkDocumentInS3, getDownloadUrl } = require('../../lib/api');
    checkDocumentInS3.mockResolvedValue({ available: true });
    getDownloadUrl.mockResolvedValue('https://example.com/preview-url');

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click preview
    const previewButton = screen.getByTestId('preview-button');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(checkDocumentInS3).toHaveBeenCalledWith('test-project-001', 'pdf');
    });

    await waitFor(() => {
      expect(getDownloadUrl).toHaveBeenCalledWith('test-project-001', 'pdf');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Document preview loaded successfully!',
        expect.objectContaining({
          duration: 3000,
          icon: '👁️',
        })
      );
    });

    // PDF preview should be visible
    expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
  });

  it('handles preview when document is not available', async () => {
    const { checkDocumentInS3 } = require('../../lib/api');
    checkDocumentInS3.mockResolvedValue({ available: false });

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click preview
    const previewButton = screen.getByTestId('preview-button');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Document not ready, try Generate first.',
        expect.objectContaining({
          duration: 4000,
          icon: '⏳',
        })
      );
    });
  });

  it('handles send approval flow', async () => {
    const { sendApprovalEmail } = require('../../lib/api');
    sendApprovalEmail.mockResolvedValue({ message: 'Email sent' });

    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // Then click send approval
    const sendApprovalButton = screen.getByTestId('send-approval-button');
    fireEvent.click(sendApprovalButton);

    // Email dialog should appear
    expect(screen.getByTestId('email-dialog')).toBeInTheDocument();

    // Submit email
    const submitButton = screen.getByTestId('submit-email');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(sendApprovalEmail).toHaveBeenCalledWith(
        'test-project-001',
        'client@example.com'
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Approval email sent successfully!',
        expect.objectContaining({
          duration: 4000,
          icon: '📧',
        })
      );
    });

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('email-dialog')).not.toBeInTheDocument();
    });
  });

  it('shows loading states for all buttons', async () => {
    render(<Dashboard />);

    // First select a project
    const projectButton = screen.getByTestId('project-button');
    fireEvent.click(projectButton);

    // All buttons should show normal state initially
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(screen.getByText('Download Word')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Send Approval')).toBeInTheDocument();
  });
});