import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should initialize as false when no auth data exists', () => {
      const newService = new AuthService();
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should initialize as true when auth data exists', () => {
      localStorage.setItem('admin_auth', 'true');
      const newService = new AuthService();
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should be reactive and update when auth state changes', () => {
      expect(service.isAuthenticated()).toBe(false);

      service.login('admin', 'admin123');
      expect(service.isAuthenticated()).toBe(true);

      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('login', () => {
    it('should store credentials and set authenticated to true', () => {
      const username = 'admin';
      const password = 'admin123';

      service.login(username, password);

      expect(localStorage.getItem('admin_auth')).toBe('true');
      expect(service.isAuthenticated()).toBe(true);

      const storedCredentials = localStorage.getItem('admin_credentials');
      expect(storedCredentials).toBe(btoa(`${username}:${password}`));
    });

    it('should encode credentials in base64', () => {
      const username = 'testuser';
      const password = 'testpass';

      service.login(username, password);

      const storedCredentials = localStorage.getItem('admin_credentials');
      const decoded = atob(storedCredentials!);

      expect(decoded).toBe(`${username}:${password}`);
    });

    it('should handle special characters in credentials', () => {
      const username = 'admin@test.com';
      const password = 'p@ssw0rd!#$';

      service.login(username, password);

      const storedCredentials = localStorage.getItem('admin_credentials');
      const decoded = atob(storedCredentials!);

      expect(decoded).toBe(`${username}:${password}`);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should overwrite previous credentials', () => {
      service.login('user1', 'pass1');
      const firstCredentials = localStorage.getItem('admin_credentials');

      service.login('user2', 'pass2');
      const secondCredentials = localStorage.getItem('admin_credentials');

      expect(firstCredentials).not.toBe(secondCredentials);
      expect(atob(secondCredentials!)).toBe('user2:pass2');
    });
  });

  describe('logout', () => {
    it('should remove auth status and set authenticated to false', () => {
      service.login('admin', 'admin123');
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(localStorage.getItem('admin_auth')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle logout when not logged in', () => {
      expect(service.isAuthenticated()).toBe(false);

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('admin_auth')).toBeNull();
    });

    it('should not remove credentials on logout', () => {
      // Note: The current implementation doesn't remove credentials on logout
      // This test documents that behavior
      service.login('admin', 'admin123');
      const credentials = localStorage.getItem('admin_credentials');

      service.logout();

      // Credentials are still there (might want to change this in the future)
      expect(localStorage.getItem('admin_credentials')).toBe(credentials);
    });
  });

  describe('getAuthHeader', () => {
    it('should generate Basic Auth header', () => {
      const username = 'admin';
      const password = 'admin123';

      const header = service.getAuthHeader(username, password);

      expect(header).toBe('Basic ' + btoa(`${username}:${password}`));
    });

    it('should encode credentials correctly', () => {
      const username = 'testuser';
      const password = 'testpass';

      const header = service.getAuthHeader(username, password);
      const encodedPart = header.replace('Basic ', '');
      const decoded = atob(encodedPart);

      expect(decoded).toBe(`${username}:${password}`);
    });

    it('should handle special characters', () => {
      const username = 'admin@test.com';
      const password = 'p@ss:w0rd!';

      const header = service.getAuthHeader(username, password);
      const encodedPart = header.replace('Basic ', '');
      const decoded = atob(encodedPart);

      expect(decoded).toBe(`${username}:${password}`);
    });

    it('should handle empty credentials', () => {
      const header = service.getAuthHeader('', '');

      expect(header).toBe('Basic ' + btoa(':'));
    });
  });

  describe('checkAuthStatus', () => {
    it('should return true when admin_auth is "true"', () => {
      localStorage.setItem('admin_auth', 'true');
      const newService = new AuthService();

      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should return false when admin_auth is "false"', () => {
      localStorage.setItem('admin_auth', 'false');
      const newService = new AuthService();

      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should return false when admin_auth is missing', () => {
      const newService = new AuthService();

      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should return false for any value other than "true"', () => {
      localStorage.setItem('admin_auth', 'yes');
      const newService = new AuthService();

      expect(newService.isAuthenticated()).toBe(false);
    });
  });

  describe('localStorage integration', () => {
    it('should persist auth state across service instances', () => {
      const service1 = new AuthService();
      service1.login('admin', 'pass');

      const service2 = new AuthService();
      expect(service2.isAuthenticated()).toBe(true);
    });

    it('should handle localStorage being cleared externally', () => {
      service.login('admin', 'pass');
      expect(service.isAuthenticated()).toBe(true);

      // Simulate external localStorage clear
      localStorage.clear();

      // Signal doesn't automatically update (expected behavior)
      // but checkAuthStatus would return false for a new instance
      const newService = new AuthService();
      expect(newService.isAuthenticated()).toBe(false);
    });
  });
});