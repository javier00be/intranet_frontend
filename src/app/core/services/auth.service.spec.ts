import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { User } from '../models';

const mockUser: User = { id: 1, email: 'director@school.com', nombre: 'Juan', apellido: 'Pérez', rol: 'director' };

const backendUser = { id: 1, email: 'director@school.com', nombre: 'Juan', apellido: 'Pérez', rol: 'DIRECTOR', avatar: '' };

function makeJwtSpy(overrides: Record<string, unknown> = {}): JwtService {
  const base: Record<string, ReturnType<typeof vi.fn>> = {
    getToken: vi.fn().mockReturnValue(null),
    getUser: vi.fn().mockReturnValue(null),
    isTokenExpired: vi.fn().mockReturnValue(true),
    setToken: vi.fn(),
    setUser: vi.fn(),
    removeToken: vi.fn()
  };
  Object.keys(overrides).forEach(k => {
    base[k] = vi.fn().mockReturnValue(overrides[k]);
  });
  return base as unknown as JwtService;
}

// ─── No stored session ────────────────────────────────────────────────────────

describe('AuthService — no stored session', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let jwtSpy: JwtService;

  beforeEach(() => {
    jwtSpy = makeJwtSpy();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: JwtService, useValue: jwtSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts unauthenticated', () => {
    expect(service.authenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  describe('login', () => {
    it('authenticates the user and maps the backend role to lowercase', async () => {
      const loginPromise = service.login('director@school.com', 'pass');
      httpMock.expectOne(r => r.url.includes('/api/auth/login')).flush({
        success: true, token: 'jwt-token', user: backendUser
      });
      const result = await loginPromise;

      expect(result.success).toBe(true);
      expect(result.user?.rol).toBe('director');
      expect(service.authenticated()).toBe(true);
      expect((jwtSpy.setToken as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('jwt-token');
    });

    it('maps PROFESOR to "profesor"', async () => {
      const loginPromise = service.login('a@b.com', 'pass');
      httpMock.expectOne(r => r.url.includes('/api/auth/login')).flush({
        success: true, token: 'tok', user: { ...backendUser, rol: 'PROFESOR' }
      });
      const result = await loginPromise;
      expect(result.user?.rol).toBe('profesor');
    });

    it('maps an unknown backend role to "estudiante" (safe fallback)', async () => {
      const loginPromise = service.login('a@b.com', 'pass');
      httpMock.expectOne(r => r.url.includes('/api/auth/login')).flush({
        success: true, token: 'tok', user: { ...backendUser, rol: 'ADMIN_LEGACY' }
      });
      const result = await loginPromise;
      expect(result.user?.rol).toBe('estudiante');
    });

    it('returns failure when credentials are wrong', async () => {
      const loginPromise = service.login('a@b.com', 'wrong');
      httpMock.expectOne(r => r.url.includes('/api/auth/login')).flush({
        success: false, message: 'Credenciales inválidas'
      });
      const result = await loginPromise;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Credenciales inválidas');
      expect(service.authenticated()).toBe(false);
    });

    it('returns an error message on network failure', async () => {
      const loginPromise = service.login('a@b.com', 'pass');
      httpMock.expectOne(r => r.url.includes('/api/auth/login')).flush(
        { message: 'Servidor no disponible' },
        { status: 500, statusText: 'Server Error' }
      );
      const result = await loginPromise;
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('logout', () => {
    it('clears user state and removes the token', async () => {
      const loginPromise = service.login('a@b.com', 'pass');
      httpMock.expectOne(r => r.url.includes('/api/auth/login')).flush({
        success: true, token: 'tok', user: backendUser
      });
      await loginPromise;

      service.logout();

      expect(service.authenticated()).toBe(false);
      expect(service.user()).toBeNull();
      expect((jwtSpy.removeToken as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    });
  });
});

// ─── Valid stored session ─────────────────────────────────────────────────────

describe('AuthService — valid stored session', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: JwtService, useValue: makeJwtSpy({ getToken: 'stored-tok', getUser: mockUser, isTokenExpired: false }) }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('restores the user and marks as authenticated on init', () => {
    expect(service.authenticated()).toBe(true);
    expect(service.user()).toEqual(mockUser);
  });
});

// ─── Expired stored session ───────────────────────────────────────────────────

describe('AuthService — expired stored session', () => {
  let service: AuthService;
  let jwtSpy: JwtService;

  beforeEach(() => {
    jwtSpy = makeJwtSpy({ getToken: 'expired-tok', getUser: mockUser, isTokenExpired: true });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: JwtService, useValue: jwtSpy }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('clears the expired token and stays unauthenticated', () => {
    expect(service.authenticated()).toBe(false);
    expect((jwtSpy.removeToken as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });
});
