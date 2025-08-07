/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as fetchWrapper from '../../utils/fetchWrapper';
import { getProjectsForCurrentUser } from '../awsDataService';

// Mock fetchWrapper module
vi.mock('../../utils/fetchWrapper', () => ({
  fetcher: vi.fn(),
}));

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

const mockFetcher = vi.mocked(fetchWrapper.fetcher);

describe('awsDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetchAuthSession to return a valid session
    const { fetchAuthSession } = require('aws-amplify/auth');
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com'
          }
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProjectsForCurrentUser', () => {
    it('should successfully fetch and map projects from API', async () => {
      // Arrange
      const mockApiProjects = [
        {
          project_id: 'proj-001',
          project_name: 'Test Project 1',
          pm_email: 'test@example.com',
          last_updated: '2023-12-01T10:00:00Z',
          has_acta_document: true
        },
        {
          project_id: 'proj-002',
          project_name: 'Test Project 2',
          pm_email: 'test@example.com',
          last_updated: '2023-12-02T15:30:00Z',
          has_acta_document: false
        }
      ];

      mockFetcher.mockResolvedValue(mockApiProjects);

      // Act
      const result = await getProjectsForCurrentUser();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'proj-001',
        name: 'Test Project 1',
        pm: 'test@example.com',
        status: 'Completed', // has_acta_document: true -> Completed
        originalData: mockApiProjects[0]
      });
      expect(result[1]).toEqual({
        id: 'proj-002',
        name: 'Test Project 2',
        pm: 'test@example.com',
        status: 'In Progress', // has_acta_document: false -> In Progress
        originalData: mockApiProjects[1]
      });

      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(mockFetcher).toHaveBeenCalledWith(
        expect.stringContaining('/projects-for-pm?email=test%40example.com&admin=false')
      );
    });

    it('should handle projects without explicit fields gracefully', async () => {
      // Arrange
      const mockApiProjects = [
        {
          id: 'legacy-proj-001',
          name: 'Legacy Project',
          project_manager: 'pm@example.com'
        }
      ];

      mockFetcher.mockResolvedValue(mockApiProjects);

      // Act
      const result = await getProjectsForCurrentUser();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'legacy-proj-001',
        name: 'Legacy Project',
        pm: 'pm@example.com',
        status: 'Active', // default status
        originalData: mockApiProjects[0]
      });
    });

    it('should fallback to sample data in development when API fails', async () => {
      // Arrange
      const originalEnv = import.meta.env.DEV;
      // @ts-ignore - mocking environment variable
      import.meta.env.DEV = true;
      
      mockFetcher.mockRejectedValue(new Error('API not accessible'));

      // Act
      const result = await getProjectsForCurrentUser();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Office Building Construction');
      expect(result[1].name).toBe('Infrastructure Upgrade');
      expect(result[2].name).toBe('Smart City Initiative');

      // Restore environment
      // @ts-ignore
      import.meta.env.DEV = originalEnv;
    });

    it('should throw error in production when API fails', async () => {
      // Arrange
      const originalEnv = import.meta.env.DEV;
      // @ts-ignore - mocking environment variable
      import.meta.env.DEV = false;
      
      const apiError = new Error('Network error');
      mockFetcher.mockRejectedValue(apiError);

      // Act & Assert
      await expect(getProjectsForCurrentUser()).rejects.toThrow('Network error');

      // Restore environment
      // @ts-ignore
      import.meta.env.DEV = originalEnv;
    });

    it('should handle missing email in session', async () => {
      // Arrange
      const { fetchAuthSession } = require('aws-amplify/auth');
      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          idToken: {
            payload: {} // no email
          }
        }
      });

      // Act & Assert
      await expect(getProjectsForCurrentUser()).rejects.toThrow('❌ No user email available');
    });

    it('should correctly map project status based on last_updated', async () => {
      // Arrange
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      const mockApiProjects = [
        {
          project_id: 'old-proj',
          project_name: 'Old Project',
          pm_email: 'test@example.com',
          last_updated: thirtyOneDaysAgo.toISOString()
        }
      ];

      mockFetcher.mockResolvedValue(mockApiProjects);

      // Act
      const result = await getProjectsForCurrentUser();

      // Assert
      expect(result[0].status).toBe('Inactive');
    });

    it('should handle empty projects array', async () => {
      // Arrange
      mockFetcher.mockResolvedValue([]);

      // Act
      const result = await getProjectsForCurrentUser();

      // Assert
      expect(result).toEqual([]);
    });
  });
});