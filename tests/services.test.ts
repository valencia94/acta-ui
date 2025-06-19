import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  api,
  extractProjectData,
  getDownloadUrl,
  getSummary,
  getTimeline,
  sendApprovalEmail,
} from '../src/services/actaApi';
beforeEach(() => {
  api.defaults.baseURL = 'http://localhost';
});

afterEach(() => {
  nock.cleanAll();
});

describe('actaApi', () => {
  it('getTimeline', async () => {
    nock('http://localhost')
      .get('/timeline/1')
      .reply(200, [{ hito: 'x' }]);
    const res = await getTimeline('1');
    expect(res.data[0].hito).toBe('x');
  });

  it('getDownloadUrl', async () => {
    nock('http://localhost')
      .get('/download-acta/1')
      .query({ format: 'pdf' })
      .reply(200, { url: 'http://file' });
    const res = await getDownloadUrl('1', 'pdf');
    expect(res.data.url).toBe('http://file');
  });

  it('getSummary', async () => {
    nock('http://localhost')
      .get('/project-summary/1')
      .reply(200, { project_id: '1' });
    const res = await getSummary('1');
    expect(res.data.project_id).toBe('1');
  });

  it('sendApprovalEmail', async () => {
    nock('http://localhost')
      .post('/send-approval-email', { projectId: '1', clientEmail: 'a@b.com' })
      .reply(200, { ok: true });
    const res = await sendApprovalEmail({
      projectId: '1',
      clientEmail: 'a@b.com',
    });
    expect(res.data.ok).toBe(true);
  });

  it('extractProjectData', async () => {
    nock('http://localhost')
      .post('/extract-project-place/1')
      .reply(200, { started: true });
    const res = await extractProjectData('1');
    expect(res.data.started).toBe(true);
  });
});
