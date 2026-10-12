import { describe, expect, it } from 'vitest';

import { getProjectSceneRequestOptions } from './index.api';

describe('project scene api request options', () => {
  it('adds project-id header when project id is provided', () => {
    expect(getProjectSceneRequestOptions('344125233982576')).toEqual({
      headers: {
        'project-id': '344125233982576',
      },
    });
  });

  it('returns undefined when project id is empty', () => {
    expect(getProjectSceneRequestOptions('')).toBeUndefined();
  });
});
