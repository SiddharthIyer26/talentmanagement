import { UserRole, Influencer, ManagementUser } from '../types';
import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

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
  supabaseToken?: string;
}

class AuthService {
  private session: AuthSession;

  constructor() {
    this.session = this.loadStoredSession();
  }

  private loadStoredSession(): AuthSession {
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
      console.error('Failed to load auth session from storage', e);
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

  /**
   * Resets local memory and storage to an unauthenticated state
   */
  public clearSession(): void {
    this.session = {
      isAuthenticated: false,
      role: 'ADMIN',
      originalRole: 'ADMIN',
      userId: '',
      username: '',
      name: '',
      loggedInAt: ''
    };
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Validates the active Supabase Auth session on app launch/refresh.
   * Guarantees unauthenticated users never see the dashboard.
   */
  public async initSession(): Promise<AuthSession> {
    if (!isSupabaseConfigured() || !supabase) {
      this.clearSession();
      return this.session;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session || !session.user) {
        this.clearSession();
        return this.session;
      }

      const authEmail = (session.user.email || '').toLowerCase().trim();
      if (!authEmail) {
        this.clearSession();
        return this.session;
      }

      // 1. Resolve management_users record (via secure RPC helper first, then direct table query)
      let mgmtUser: any = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_current_management_user');
        if (!rpcErr && rpcData) {
          mgmtUser = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        }
      } catch {
        // Fall back to direct query
      }

      if (!mgmtUser) {
        const { data: tableData, error: mgmtErr } = await supabase
          .from('management_users')
          .select('*')
          .ilike('email', authEmail)
          .maybeSingle();

        if (mgmtErr) {
          console.warn('Notice querying management_users:', mgmtErr.message);
        }
        mgmtUser = tableData;
      }

      if (mgmtUser) {
        if (mgmtUser.account_status === 'disabled') {
          await this.logout();
          return this.session;
        }

        const validSession: AuthSession = {
          isAuthenticated: true,
          role: 'ADMIN',
          originalRole: 'ADMIN',
          userId: mgmtUser.id,
          username: mgmtUser.username || mgmtUser.email,
          name: mgmtUser.name,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          loggedInAt: this.session.loggedInAt || new Date().toISOString(),
          supabaseToken: session.access_token
        };

        this.session = validSession;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validSession));

        // Keep local memory db synchronized
        db.saveManagementUser({
          id: mgmtUser.id,
          name: mgmtUser.name,
          email: mgmtUser.email,
          phone: mgmtUser.phone || '',
          username: mgmtUser.username,
          password: '',
          role: mgmtUser.role,
          accountStatus: mgmtUser.account_status || 'active'
        });

        return this.session;
      }

      // 2. Query influencers table
      const { data: infUser, error: infErr } = await supabase
        .from('influencers')
        .select('*')
        .ilike('email', authEmail)
        .maybeSingle();

      if (!infErr && infUser) {
        if (infUser.account_status === 'disabled') {
          await this.logout();
          return this.session;
        }

        const validSession: AuthSession = {
          isAuthenticated: true,
          role: 'INFLUENCER',
          originalRole: 'INFLUENCER',
          userId: infUser.id,
          username: infUser.username || infUser.handle,
          name: infUser.name,
          influencerId: infUser.id,
          primaryInfluencerId: infUser.id,
          avatarUrl: infUser.avatar_url,
          loggedInAt: this.session.loggedInAt || new Date().toISOString(),
          supabaseToken: session.access_token
        };

        this.session = validSession;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validSession));
        return this.session;
      }

      // Authenticated with Supabase Auth, but no workspace user found
      await this.logout();
      return this.session;
    } catch (err) {
      console.error('Session initialization error:', err);
      this.clearSession();
      return this.session;
    }
  }

  public getSession(): AuthSession {
    return this.session;
  }

  public isAuthenticated(): boolean {
    return this.session.isAuthenticated;
  }

  /**
   * Authenticates against Supabase Auth only.
   * Plain-text/localStorage passwords are never used for authentication.
   */
  public async login(
    usernameOrEmail: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string; session?: AuthSession }> {
    const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanInput || !cleanPass) {
      return { success: false, message: 'Please enter both username/email and password.' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        message: 'Supabase authentication is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      };
    }

    // Resolve target email if user entered a username
    let targetEmail = cleanInput;
    if (!cleanInput.includes('@')) {
      const mgmtUsers = db.getManagementUsers();
      const mgmtMatch = mgmtUsers.find(
        u => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
      );
      if (mgmtMatch && mgmtMatch.email) {
        targetEmail = mgmtMatch.email.toLowerCase();
      } else {
        const influencers = db.getInfluencers();
        const infMatch = influencers.find(inf => {
          const cleanHandle = inf.handle.replace('@', '').toLowerCase();
          const cleanUser = (inf.username || '').toLowerCase();
          return cleanInput === cleanHandle || cleanInput === cleanUser;
        });
        if (infMatch && infMatch.email) {
          targetEmail = infMatch.email.toLowerCase();
        }
      }
    }

    if (!targetEmail.includes('@')) {
      return {
        success: false,
        message: 'Please enter your registered email address (e.g. siddharthiyer.work@gmail.com).'
      };
    }

    try {
      // 1. Authenticate strictly with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass
      });

      if (authErr || !authData.user) {
        return {
          success: false,
          message: authErr?.message || 'Invalid email or password. Please check your credentials.'
        };
      }

      const authenticatedEmail = (authData.user.email || targetEmail).toLowerCase().trim();

      // 2. Load authenticated user's management_users record
      // Try secure RPC helper first, fall back to direct table query
      let mgmtUser: any = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_current_management_user');
        if (!rpcErr && rpcData) {
          mgmtUser = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        }
      } catch {
        // Fall back to direct query
      }

      if (!mgmtUser) {
        const { data: tableData, error: mgmtErr } = await supabase
          .from('management_users')
          .select('*')
          .ilike('email', authenticatedEmail)
          .maybeSingle();

        if (mgmtErr) {
          console.warn('Notice querying management_users:', mgmtErr.message);
        }
        mgmtUser = tableData;
      }

      if (mgmtUser) {
        if (mgmtUser.account_status === 'disabled') {
          await supabase.auth.signOut();
          this.clearSession();
          return {
            success: false,
            message: 'Account access disabled. Please contact system administrator.'
          };
        }

        // Owner/Admin gets full admin portal access
        const adminSession: AuthSession = {
          isAuthenticated: true,
          role: 'ADMIN',
          originalRole: 'ADMIN',
          userId: mgmtUser.id,
          username: mgmtUser.username || mgmtUser.email,
          name: mgmtUser.name,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          loggedInAt: new Date().toISOString(),
          supabaseToken: authData.session?.access_token
        };

        this.session = adminSession;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminSession));

        // Sync management record into local app state (passwords never stored)
        db.saveManagementUser({
          id: mgmtUser.id,
          name: mgmtUser.name,
          email: mgmtUser.email,
          phone: mgmtUser.phone || '',
          username: mgmtUser.username,
          password: '',
          role: mgmtUser.role,
          accountStatus: mgmtUser.account_status || 'active'
        });

        return { success: true, session: adminSession };
      }

      // 3. Fallback: Check if user is an Influencer
      const { data: infUser, error: infErr } = await supabase
        .from('influencers')
        .select('*')
        .ilike('email', authenticatedEmail)
        .maybeSingle();

      if (infErr) {
        console.warn('Notice querying influencers:', infErr.message);
      }

      if (infUser) {
        if (infUser.account_status === 'disabled') {
          await supabase.auth.signOut();
          this.clearSession();
          return {
            success: false,
            message: 'Influencer creator workspace disabled. Contact talent manager.'
          };
        }

        // Influencers only access their own creator portal
        const influencerSession: AuthSession = {
          isAuthenticated: true,
          role: 'INFLUENCER',
          originalRole: 'INFLUENCER',
          userId: infUser.id,
          username: infUser.username || infUser.handle,
          name: infUser.name,
          influencerId: infUser.id,
          primaryInfluencerId: infUser.id,
          avatarUrl: infUser.avatar_url,
          loggedInAt: new Date().toISOString(),
          supabaseToken: authData.session?.access_token
        };

        this.session = influencerSession;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(influencerSession));

        return { success: true, session: influencerSession };
      }

      // No registered profile found in schema
      await supabase.auth.signOut();
      this.clearSession();
      return {
        success: false,
        message: 'No registered workspace profile found for this authenticated user.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Authentication error occurred.'
      };
    }
  }

  /**
   * Alias for backward compatibility
   */
  public async loginWithCloudAuth(email: string, password: string) {
    return this.login(email, password);
  }

  public async logout(): Promise<void> {
    this.clearSession();
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout network errors
      }
    }
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
