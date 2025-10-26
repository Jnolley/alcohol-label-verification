import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'admin_auth';

  // Signal for reactive auth state
  isAuthenticated = signal<boolean>(this.checkAuthStatus());

  /**
   * Check if admin is currently authenticated
   */
  private checkAuthStatus(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  /**
   * Log in the admin user and store credentials
   */
  login(username: string, password: string): void {
    const credentials = btoa(`${username}:${password}`);
    localStorage.setItem('admin_credentials', credentials);
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.isAuthenticated.set(true);
  }

  /**
   * Log out the admin user
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.isAuthenticated.set(false);
  }

  /**
   * Get Basic Auth header for API requests
   */
  getAuthHeader(username: string, password: string): string {
    const credentials = btoa(`${username}:${password}`);
    return `Basic ${credentials}`;
  }
}