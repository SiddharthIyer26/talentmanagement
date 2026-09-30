import { UserRole, Influencer, ManagementUser } from '../types';
import { db } from './db';

const AUTH_STORAGE_KEY = 'iyer_talent_os_auth_session_v2';

export interface AuthSession {
  isAuthenticated: boolean;
  role: UserRole; // 'ADMIN' | 'INFLUENCER' (Active role view)
  originalRole: UserRole; // 'ADMIN' | 'INFLUENCER' (Primary authenticated account role)
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  influencerId?: string; // Active influencer ID being viewed
  primaryInfluencerId?: string; // Bound influencer ID for influencer account
  loggedInAt: string;
}

class AuthService {
  private session: AuthSession;

  constructor() {
    this.session = this.loadSession();
  }

  private loadSession(): AuthSession {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isAuthenticated) {
          return {
            ...parsed,
            originalRole: parsed.originalRole || (parsed.role === 'INFLUENCER' && parsed.influencerId ? 'INFLUENCER' : 'ADMIN')
          };
        }
      }
    } catch (e) {
      console.error('Failed to load auth session', e);
    }
    return {
      isAuthenticated: false,
      role: 'ADMIN',
      originalRole: 'ADMIN',
      userId: '',
      username: '',
      name: '',
      loggedInAt: ''
    };
  }

  public getSession(): AuthSession {
    return this.session;
  }

  public isAuthenticated(): boolean {
    return this.session.isAuthenticated;
  }

  public login(usernameOrEmail: string, passwordInput: string): { success: boolean; message?: string; session?: AuthSession } {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // 1. Check Management / Admin users first
    const mgmtUsers = db.getManagementUsers();
    const mgmtMatch = mgmtUsers.find(
      u => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
    );

    if (mgmtMatch) {
      if (mgmtMatch.accountStatus === 'disabled') {
        return { success: false, message: 'Account access disabled. Please contact system administrator.' };
      }
      if (mgmtMatch.password !== cleanPass) {
        return { success: false, message: 'Invalid password. Please check your credentials.' };
      }

      const session: AuthSession = {
        isAuthenticated: true,
        role: 'ADMIN',
        originalRole: 'ADMIN',
        userId: mgmtMatch.id,
        username: mgmtMatch.username,
        name: mgmtMatch.name,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        loggedInAt: new Date().toISOString()
      };

      this.session = session;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return { success: true, session };
    }

    // 2. Check Influencer users
    const influencers = db.getInfluencers();
    const infMatch = influencers.find(inf => {
      const cleanHandle = inf.handle.replace('@', '').toLowerCase();
      const cleanUser = (inf.username || '').toLowerCase();
      const cleanEmail = (inf.email || '').toLowerCase();
      return cleanInput === cleanHandle || cleanInput === cleanUser || cleanInput === cleanEmail;
    });

    if (infMatch) {
      if (infMatch.accountStatus === 'disabled') {
        return { success: false, message: 'Influencer creator workspace disabled. Contact talent manager.' };
      }
      const actualPassword = infMatch.password || 'password123';
      if (actualPassword !== cleanPass) {
        return { success: false, message: 'Invalid password. Please check your credentials.' };
      }

      const session: AuthSession = {
        isAuthenticated: true,
        role: 'INFLUENCER',
        originalRole: 'INFLUENCER',
        userId: infMatch.id,
        username: infMatch.username || infMatch.handle,
        name: infMatch.name,
        influencerId: infMatch.id,
        primaryInfluencerId: infMatch.id,
        avatarUrl: infMatch.avatarUrl,
        loggedInAt: new Date().toISOString()
      };

      this.session = session;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return { success: true, session };
    }

    return { success: false, message: 'No account found with this username or email.' };
  }

  public logout() {
    this.session = {
      isAuthenticated: false,
      role: 'ADMIN',
      originalRole: 'ADMIN',
      userId: '',
      username: '',
      name: '',
      loggedInAt: ''
    };
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  public getRole(): 'admin' | 'influencer' {
    return this.session.role === 'ADMIN' ? 'admin' : 'influencer';
  }

  public isAdmin(): boolean {
    return this.session.isAuthenticated && this.session.role === 'ADMIN';
  }

  public isInfluencer(): boolean {
    return this.session.isAuthenticated && this.session.role === 'INFLUENCER';
  }

  public canSwitchRole(): boolean {
    return this.session.isAuthenticated && this.session.originalRole === 'ADMIN';
  }

  public switchRole(targetRole: 'ADMIN' | 'INFLUENCER', influencerId?: string): boolean {
    if (!this.canSwitchRole()) {
      console.warn('Access Control: Unauthorized role switch attempt blocked.');
      return false;
    }

    if (targetRole === 'ADMIN') {
      this.session = {
        ...this.session,
        role: 'ADMIN',
        influencerId: undefined
      };
    } else if (targetRole === 'INFLUENCER' && influencerId) {
      const inf = db.getInfluencerById(influencerId);
      if (!inf) return false;
      this.session = {
        ...this.session,
        role: 'INFLUENCER',
        influencerId: inf.id
      };
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.session));
    return true;
  }

  public setAdminRole(): boolean {
    return this.switchRole('ADMIN');
  }

  public setInfluencerRole(influencerId: string): boolean {
    return this.switchRole('INFLUENCER', influencerId);
  }

  public getActiveInfluencerId(): string | undefined {
    if (this.session.originalRole === 'INFLUENCER') {
      return this.session.primaryInfluencerId;
    }
    return this.session.influencerId;
  }

  public getActiveInfluencer(): Influencer | undefined {
    const infId = this.getActiveInfluencerId();
    if (infId) {
      return db.getInfluencerById(infId);
    }
    return undefined;
  }

  public canAccessAdminTab(tabName: string): boolean {
    if (this.isAdmin()) return true;
    const allowedInfluencerTabs = [
      'portal',
      'portal-dashboard',
      'my-collaborations',
      'monthly-overview',
      'monthly-history',
      'monthly-report',
      'my-insights',
      'portal-calendar',
      'portal-analytics',
      'my-rate-card',
      'portal-payments',
      'payments'
    ];
    return allowedInfluencerTabs.includes(tabName);
  }

  public shouldShowDailyWelcome(userId: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const welcomeKey = `iyer_welcome_shown_${today}_${userId}`;
    const alreadyShown = localStorage.getItem(welcomeKey);
    if (alreadyShown) {
      return false;
    }
    return true;
  }

  public markDailyWelcomeShown(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const welcomeKey = `iyer_welcome_shown_${today}_${userId}`;
    localStorage.setItem(welcomeKey, 'true');
  }
}

export const authService = new AuthService();

