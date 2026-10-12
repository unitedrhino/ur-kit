import { describe, expect, it } from 'vitest';

import { Button, Dialog, Select } from '@unitedrhino/saas-ui';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { Button as SubpathButton } from '@unitedrhino/saas-ui/ui/button';

describe('@unitedrhino/saas-ui public imports', () => {
  it('exports common components from root and subpath entries', () => {
    expect(Button).toBe(SubpathButton);
    expect(Dialog).toBeTruthy();
    expect(Select).toBeTruthy();
    expect(cn('px-2', false && 'hidden', 'px-4')).toBe('px-4');
  });
});
