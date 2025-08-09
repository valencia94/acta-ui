import { toast } from 'react-hot-toast';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as fetchWrapper from '../../utils/fetchWrapper';
import { checkDocumentInS3, generateActaDocument } from '../api';

vi.mock('react-hot-toast', () => ({ toast: vi.fn() }));

const mockedPost = vi.spyOn(fetchWrapper, 'postFireAndForget').mockResolvedValue({ accepted: true } as any);
const mockedFetcher = vi.spyOn(fetchWrapper, 'fetcherRaw');
const mockedToast = vi.mocked(toast);

beforeEach(() => {
  mockedPost.mockClear();
  mockedFetcher.mockReset();
  mockedToast.mockClear();
});

describe('generateActaDocument', () => {
  it('sends minimal payload', async () => {
    await generateActaDocument('123', 'pm@example.com', 'pm');
    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [url, payload] = mockedPost.mock.calls[0];
    expect(url).toContain('/extract-project-place/123');
    expect(payload).toEqual({
      pmEmail: 'pm@example.com',
      userRole: 'pm',
      requestSource: 'acta-ui',
      generateDocuments: true,
      extractMetadata: true,
      timestamp: expect.any(String),
    });
  });
});

describe('checkDocumentInS3', () => {
  it('returns availability on success', async () => {
    mockedFetcher.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Last-Modified': 'Mon, 01 Jan 2024 00:00:00 GMT',
        'Content-Length': '100',
      }),
    } as any);
    const result = await checkDocumentInS3('123', 'pdf');
    expect(mockedFetcher).toHaveBeenCalledWith(
      expect.stringContaining('/document-validator/123?format=pdf'),
      { method: 'HEAD' },
    );
    expect(result).toEqual({
      available: true,
      lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT',
      size: 100,
      s3Key: 'acta-documents/acta-123.pdf',
    });
  });

  it('flags not_found on 404', async () => {
    mockedFetcher.mockResolvedValue({ ok: false, status: 404, headers: new Headers() } as any);
    const result = await checkDocumentInS3('123', 'pdf');
    expect(result.available).toBe(false);
    expect(result.status).toBe('not_found');
    expect(mockedToast).toHaveBeenCalled();
  });
});
