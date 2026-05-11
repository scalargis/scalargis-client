import { removeUrlParam, addUrlParam, isRelativePath, isAdminOrManager } from './core/utils';

describe('Viewer core utils', () => {
  describe('removeUrlParam', () => {
    it('removes a query parameter from a URL', () => {
      const url = 'http://example.com/map?layer=osm&zoom=5';
      expect(removeUrlParam(url, 'zoom')).toBe('http://example.com/map?layer=osm');
    });

    it('returns the base URL when removing the only parameter', () => {
      const url = 'http://example.com/map?zoom=5';
      expect(removeUrlParam(url, 'zoom')).toBe('http://example.com/map?');
    });

    it('returns the URL unchanged if parameter is not present', () => {
      const url = 'http://example.com/map?layer=osm';
      expect(removeUrlParam(url, 'zoom')).toBe('http://example.com/map?layer=osm');
    });
  });

  describe('addUrlParam', () => {
    it('appends a parameter to a URL with existing params', () => {
      const url = 'http://example.com/map?layer=osm';
      expect(addUrlParam(url, 'zoom', '5')).toBe('http://example.com/map?layer=osm&zoom=5');
    });

    it('adds the first parameter to a bare URL', () => {
      const url = 'http://example.com/map';
      expect(addUrlParam(url, 'zoom', '5')).toBe('http://example.com/map?zoom=5');
    });
  });

  describe('isRelativePath', () => {
    it('returns true for relative paths', () => {
      expect(isRelativePath('images/logo.png')).toBe(true);
    });

    it('returns false for absolute paths', () => {
      expect(isRelativePath('/api/data')).toBe(false);
    });

    it('returns false for URLs with protocol', () => {
      expect(isRelativePath('http://example.com')).toBe(false);
    });
  });

  describe('isAdminOrManager', () => {
    it('returns true for admin role', () => {
      expect(isAdminOrManager({ data: { userroles: ['Admin'] } })).toBe(true);
    });

    it('returns true for manager role (case-insensitive)', () => {
      expect(isAdminOrManager({ data: { userroles: ['MANAGER'] } })).toBe(true);
    });

    it('returns false for regular user', () => {
      expect(isAdminOrManager({ data: { userroles: ['viewer'] } })).toBe(false);
    });

    it('returns false for null/undefined auth', () => {
      expect(isAdminOrManager(null)).toBe(false);
      expect(isAdminOrManager(undefined)).toBe(false);
    });

    it('reads from response.userroles when data is absent', () => {
      expect(isAdminOrManager({ response: { userroles: ['admin'] } })).toBe(true);
    });
  });
});
