import { fetchAuthSession } from 'aws-amplify/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiCall } from '@/lib/api-amplify';

// Mock aws-amplify auth
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('API Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  it('should attach Authorization header with JWT token on project-fetch calls', async () => {
    // Mock successful auth session
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token';
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: {
          toString: () => mockToken,
        },
      },
    } as any);

    // Mock successful fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ project_id: '123', project_name: 'Test Project' }],
      headers: new Headers({ 'Content-Type': 'application/json' }),
    } as any);

    // Call the API function that would be used for project fetching
    await apiCall('/pm-manager/test@example.com', 'GET');

    // Verify fetch was called with correct Authorization header
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pm-manager/test@example.com'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should handle missing JWT token gracefully', async () => {
    // Mock auth session without token
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: null,
    } as any);

    // Mock successful fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: new Headers({ 'Content-Type': 'application/json' }),
    } as any);

    // Call the API function
    await apiCall('/pm-manager/test@example.com', 'GET');

    // Verify fetch was called without Authorization header
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pm-manager/test@example.com'),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
  });

  it('should handle auth session errors gracefully', async () => {
    // Mock auth session failure
    vi.mocked(fetchAuthSession).mockRejectedValue(new Error('Auth session failed'));

    // Mock successful fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: new Headers({ 'Content-Type': 'application/json' }),
    } as any);

    // Call the API function - should not throw
    await expect(apiCall('/pm-manager/test@example.com', 'GET')).resolves.toBeDefined();

    // Verify fetch was called without Authorization header
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pm-manager/test@example.com'),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
  });
});
