import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredToken, setStoredToken } from './services/api';

describe('Vyapar Memory AI Frontend Auth & API Client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and clears JWT workspace token accurately', () => {
    expect(getStoredToken()).toBeNull();
    setStoredToken('sample-jwt-token');
    expect(getStoredToken()).toBe('sample-jwt-token');
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });
});
