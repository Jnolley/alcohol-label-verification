import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAdminService: jasmine.SpyObj<AdminService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAdminService = jasmine.createSpyObj('AdminService', ['login']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: mockAdminService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form initialization', () => {
    it('should initialize form with default values', () => {
      expect(component.loginForm.value).toEqual({
        username: 'admin',
        password: 'admin123',
      });
    });

    it('should have required validators on username field', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('');

      expect(usernameControl?.valid).toBe(false);
      expect(usernameControl?.hasError('required')).toBe(true);
    });

    it('should have required validators on password field', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');

      expect(passwordControl?.valid).toBe(false);
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should be valid with username and password', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'testpass',
      });

      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: '',
      });

      component.onSubmit();

      expect(mockAdminService.login).not.toHaveBeenCalled();
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not submit if username is missing', () => {
      component.loginForm.patchValue({
        username: null,
        password: 'password',
      });

      component.onSubmit();

      expect(mockAdminService.login).not.toHaveBeenCalled();
    });

    it('should not submit if password is missing', () => {
      component.loginForm.patchValue({
        username: 'admin',
        password: null,
      });

      component.onSubmit();

      expect(mockAdminService.login).not.toHaveBeenCalled();
    });

    it('should successfully login with valid credentials', () => {
      const mockResponse = { success: true, message: 'Login successful' };
      mockAdminService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'admin',
        password: 'admin123',
      });

      component.onSubmit();

      expect(component.loading()).toBe(true);
      expect(mockAdminService.login).toHaveBeenCalledWith('admin', 'admin123');
      expect(mockAuthService.login).toHaveBeenCalledWith('admin', 'admin123');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
      expect(component.error()).toBeNull();
    });

    it('should set loading state during login', () => {
      mockAdminService.login.and.returnValue(of({ success: true, message: 'Login successful' }));

      component.loginForm.patchValue({
        username: 'admin',
        password: 'admin123',
      });

      expect(component.loading()).toBe(false);
      component.onSubmit();
      expect(component.loading()).toBe(true);
    });

    it('should clear error when submitting', () => {
      mockAdminService.login.and.returnValue(of({ success: true, message: 'Login successful' }));

      component.error.set('Previous error');
      component.onSubmit();

      expect(component.error()).toBeNull();
    });

    it('should handle login error with error message from server', () => {
      const errorResponse = {
        error: {
          error: {
            message: 'Invalid admin credentials',
          },
        },
      };
      mockAdminService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Invalid admin credentials');
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle login error with default message', () => {
      const errorResponse = { error: {} };
      mockAdminService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Invalid credentials. Please try again.');
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle network error', () => {
      mockAdminService.login.and.returnValue(
        throwError(() => ({ status: 0, message: 'Network error' }))
      );

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Invalid credentials. Please try again.');
    });

    it('should handle 401 unauthorized error', () => {
      const errorResponse = {
        status: 401,
        error: {
          error: {
            message: 'Unauthorized',
          },
        },
      };
      mockAdminService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Unauthorized');
    });
  });

  describe('Signals', () => {
    it('should initialize error signal as null', () => {
      expect(component.error()).toBeNull();
    });

    it('should initialize loading signal as false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should update error signal', () => {
      component.error.set('Test error');
      expect(component.error()).toBe('Test error');
    });

    it('should update loading signal', () => {
      component.loading.set(true);
      expect(component.loading()).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should complete full login flow', () => {
      mockAdminService.login.and.returnValue(of({ success: true, message: 'Login successful' }));

      // Set credentials
      component.loginForm.patchValue({
        username: 'testadmin',
        password: 'testpass',
      });

      // Submit
      component.onSubmit();

      // Verify the flow
      expect(mockAdminService.login).toHaveBeenCalledWith('testadmin', 'testpass');
      expect(mockAuthService.login).toHaveBeenCalledWith('testadmin', 'testpass');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should allow retry after failed login', () => {
      // First attempt fails
      mockAdminService.login.and.returnValue(
        throwError(() => ({ error: { error: { message: 'Invalid credentials' } } }))
      );
      component.onSubmit();

      expect(component.error()).toBe('Invalid credentials');
      expect(component.loading()).toBe(false);

      // Second attempt succeeds
      mockAdminService.login.and.returnValue(of({ success: true, message: 'Login successful' }));
      component.onSubmit();

      expect(component.error()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });
  });
});