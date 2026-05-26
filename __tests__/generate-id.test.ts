import { generateId } from '@/lib/generate-id';

describe('generateId', () => {
  it('generates a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('generates ids with dashes (UUID format)', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f-]+$/);
  });
});
