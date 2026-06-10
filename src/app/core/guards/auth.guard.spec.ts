import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models';

function buildAuthMock(isLoggedIn: boolean, user: User | null = null) {
  return {
    isLoggedIn: vi.fn().mockReturnValue(isLoggedIn),
    user: vi.fn().mockReturnValue(user)
  };
}

function buildRouterMock() {
  return { navigate: vi.fn() };
}

function routeWithRoles(roles: string[]): ActivatedRouteSnapshot {
  return { data: { roles } } as unknown as ActivatedRouteSnapshot;
}

// ─── authGuard ────────────────────────────────────────────────────────────────

describe('authGuard — user is authenticated', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: buildAuthMock(true) },
        { provide: Router, useValue: buildRouterMock() }
      ]
    });
  });

  it('returns true', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });
});

describe('authGuard — user is not authenticated', () => {
  let router: ReturnType<typeof buildRouterMock>;

  beforeEach(() => {
    router = buildRouterMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: buildAuthMock(false) },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('returns false and redirects to /auth/login', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});

// ─── guestGuard ───────────────────────────────────────────────────────────────

describe('guestGuard — user is not logged in', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: buildAuthMock(false) },
        { provide: Router, useValue: buildRouterMock() }
      ]
    });
  });

  it('returns true (login page is accessible)', () => {
    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
    expect(result).toBe(true);
  });
});

describe('guestGuard — user is already logged in', () => {
  const cases: Array<{ rol: User['rol']; expectedRoute: string }> = [
    { rol: 'director',   expectedRoute: '/director/dashboard' },
    { rol: 'profesor',   expectedRoute: '/profesor/cursos' },
    { rol: 'padre',      expectedRoute: '/padre/dashboard' },
    { rol: 'estudiante', expectedRoute: '/estudiante/cursos' }
  ];

  cases.forEach(({ rol, expectedRoute }) => {
    describe(`with rol "${rol}"`, () => {
      let router: ReturnType<typeof buildRouterMock>;

      beforeEach(() => {
        router = buildRouterMock();
        const user: User = { id: 1, email: 'a@b.com', nombre: 'A', apellido: 'B', rol };
        TestBed.configureTestingModule({
          providers: [
            { provide: AuthService, useValue: buildAuthMock(true, user) },
            { provide: Router, useValue: router }
          ]
        });
      });

      it(`blocks and redirects to ${expectedRoute}`, () => {
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith([expectedRoute]);
      });
    });
  });
});

// ─── roleGuard ────────────────────────────────────────────────────────────────

describe('roleGuard — user has the required role', () => {
  beforeEach(() => {
    const user: User = { id: 1, email: 'a@b.com', nombre: 'A', apellido: 'B', rol: 'director' };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: buildAuthMock(true, user) },
        { provide: Router, useValue: buildRouterMock() }
      ]
    });
  });

  it('returns true', () => {
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(routeWithRoles(['director', 'profesor']), {} as any)
    );
    expect(result).toBe(true);
  });
});

describe('roleGuard — user lacks the required role', () => {
  let router: ReturnType<typeof buildRouterMock>;

  beforeEach(() => {
    router = buildRouterMock();
    const user: User = { id: 2, email: 'a@b.com', nombre: 'A', apellido: 'B', rol: 'profesor' };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: buildAuthMock(true, user) },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('returns false and redirects profesor to their own area', () => {
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(routeWithRoles(['director']), {} as any)
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/profesor/cursos']);
  });
});

describe('roleGuard — unauthenticated user', () => {
  let router: ReturnType<typeof buildRouterMock>;

  beforeEach(() => {
    router = buildRouterMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: buildAuthMock(false, null) },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('returns false and redirects to /auth/login', () => {
    TestBed.runInInjectionContext(() =>
      roleGuard(routeWithRoles(['director']), {} as any)
    );
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
