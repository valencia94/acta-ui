/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getProjectsForCurrentUser } from '../../lib/awsDataService';
import DynamoProjectsView, { Project } from '../DynamoProjectsView';

vi.mock('../../lib/awsDataService');

describe('DynamoProjectsView', () => {
  it('renders project name', async () => {
    const mockProject: Project = {
      id: '1',
      name: 'Test Project',
      pm: 'pm@example.com',
      status: 'Active',
    };
    vi.mocked(getProjectsForCurrentUser).mockResolvedValue([mockProject]);

    render(
      <DynamoProjectsView userEmail="user@example.com" selectedProjectId="" />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });
});
