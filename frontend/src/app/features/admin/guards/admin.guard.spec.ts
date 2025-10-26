import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../../../core/services/auth.service';

describe('adminGuard', () => {
  let authService: AuthService;
  let router: Router;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow access when user is authenticated', () => {
    authService.login('admin', 'admin123');

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login when user is not authenticated', () => {
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('should redirect to login after logout', () => {
    authService.login('admin', 'admin123');
    authService.logout();

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('should check authentication status on each guard execution', () => {
    // First call - not authenticated
    let result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(false);

    // Login
    authService.login('admin', 'admin123');

    // Second call - authenticated
    result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should use inject to get AuthService and Router', () => {
    // This test verifies the guard uses inject() correctly
    // by checking it works within the injection context
    authService.login('admin', 'pass');

    expect(() => {
      TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    }).not.toThrow();
  });

  it('should handle missing localStorage data', () => {
    localStorage.clear();

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('admin_auth', 'invalid-value');

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});