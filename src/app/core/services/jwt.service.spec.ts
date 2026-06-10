import { TestBed } from '@angular/core/testing';
import { JwtService } from './jwt.service';
import { User } from '../models';

function buildToken(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: '1', exp }));
  return `header.${payload}.signature`;
}

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  describe('token storage', () => {
    it('stores and retrieves a token', () => {
      service.setToken('abc123');
      expect(service.getToken()).toBe('abc123');
    });

    it('returns null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('removeToken clears both token and user', () => {
      const user: User = { id: 1, email: 'a@b.com', nombre: 'Ana', apellido: 'García', rol: 'director' };
      service.setToken('tok');
      service.setUser(user);
      service.removeToken();
      expect(service.getToken()).toBeNull();
      expect(service.getUser()).toBeNull();
    });
  });

  describe('user storage', () => {
    it('stores and retrieves a user', () => {
      const user: User = { id: 1, email: 'a@b.com', nombre: 'Ana', apellido: 'García', rol: 'director' };
      service.setUser(user);
      expect(service.getUser()).toEqual(user);
    });

    it('returns null when no user is stored', () => {
      expect(service.getUser()).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns true when there is no token', () => {
      expect(service.isTokenExpired()).toBe(true);
    });

    it('returns false for a token expiring in the future', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      service.setToken(buildToken(futureExp));
      expect(service.isTokenExpired()).toBe(false);
    });

    it('returns true for an already expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      service.setToken(buildToken(pastExp));
      expect(service.isTokenExpired()).toBe(true);
    });

    it('returns true for a single-segment token (no payload to decode)', () => {
      service.setToken('not-a-jwt');
      expect(service.isTokenExpired()).toBe(true);
    });

    it('returns true for a token whose payload is not valid JSON', () => {
      service.setToken('header.!!!.signature');
      expect(service.isTokenExpired()).toBe(true);
    });
  });
});
