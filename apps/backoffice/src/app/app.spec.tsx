import { removeUrlParam, generateRGBA, isAdminOrManager } from './core/utils';

describe('Backoffice core utils', () => {
  describe('removeUrlParam', () => {
    it('removes a query parameter', () => {
      const url = 'http://example.com/admin?tab=users&page=2';
      expect(removeUrlParam(url, 'page')).toBe('http://example.com/admin?tab=users');
    });
  });

  describe('generateRGBA', () => {
    it('returns a comma-separated RGBA string', () => {
      const rgba = generateRGBA();
      const parts = rgba.split(',');
      expect(parts).toHaveLength(4);
      expect(Number(parts[3])).toBe(1);
    });

    it('generates values in 0-255 range', () => {
      for (let i = 0; i < 10; i++) {
        const parts = generateRGBA().split(',').map(Number);
        expect(parts[0]).toBeGreaterThanOrEqual(0);
        expect(parts[0]).toBeLessThan(256);
        expect(parts[1]).toBeGreaterThanOrEqual(0);
        expect(parts[1]).toBeLessThan(256);
      }
    });
  });

  describe('isAdminOrManager', () => {
    it('returns true for admin users', () => {
      expect(isAdminOrManager({ data: { userroles: ['Admin'] } })).toBe(true);
    });

    it('returns false for non-admin users', () => {
      expect(isAdminOrManager({ data: { userroles: ['viewer'] } })).toBe(false);
    });

    it('handles null auth gracefully', () => {
      expect(isAdminOrManager(null)).toBe(false);
    });
  });
});
