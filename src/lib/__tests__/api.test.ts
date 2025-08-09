/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as fetchWrapper from '../../utils/fetchWrapper';
import { getProjectsByPM } from '../api';

// Mock fetchWrapper module
vi.mock('../../utils/fetchWrapper', () => {
  const mod: any = {
    getAuthToken: vi.fn(),
    get: vi.fn(async (url: string) => {
      let token: string | null = null;
      try {
        token = await mod.getAuthToken();
      } catch {
        token = null;
      }
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res: any = await fetch(url, { headers });
      if (!res.ok) {
        const text = (await res.text?.()) || '';
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return res.json();
    }),
  };
  return mod;
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          project_id: '1',
          project_name: 'Test Project',
          pm: 'test@example.com',
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include Authorization header when token is available', async () => {
    // Arrange
    const mockToken = 'mock-jwt-token-12345';
    const pmEmail = 'test@example.com';

    vi.mocked(fetchWrapper.getAuthToken).mockResolvedValue(mockToken);

    // Act
    await getProjectsByPM(pmEmail, false);

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('/projects-for-pm');
    expect(options.headers).toHaveProperty('Authorization', `Bearer ${mockToken}`);
    expect(fetchWrapper.getAuthToken).toHaveBeenCalledTimes(1);
  });

  it('should make request without Authorization header when token is null', async () => {
    // Arrange
    const pmEmail = 'test@example.com';

    vi.mocked(fetchWrapper.getAuthToken).mockResolvedValue(null);

    // Act
    await getProjectsByPM(pmEmail, false);

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('/projects-for-pm');
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(fetchWrapper.getAuthToken).toHaveBeenCalledTimes(1);
  });

  it('should handle authentication token retrieval failure gracefully', async () => {
    // Arrange
    const pmEmail = 'test@example.com';

    vi.mocked(fetchWrapper.getAuthToken).mockRejectedValue(new Error('Auth failed'));

    // Act
    await getProjectsByPM(pmEmail, false);

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('/projects-for-pm');
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(fetchWrapper.getAuthToken).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors properly when unauthorized', async () => {
    // Arrange
    const pmEmail = 'test@example.com';
    const mockToken = 'expired-token';

    vi.mocked(fetchWrapper.getAuthToken).mockResolvedValue(mockToken);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid or expired token',
    });

    // Act & Assert
    await expect(getProjectsByPM(pmEmail, false)).rejects.toThrow('401: Invalid or expired token');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(options.headers).toHaveProperty('Authorization', `Bearer ${mockToken}`);
  });
});
