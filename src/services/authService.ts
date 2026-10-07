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

      // Fallback: check local memory if cloud table hasn't synced this email yet
      if (!mgmtUser) {
        const localMgmt = db.getManagementUsers().find(u => u.email.toLowerCase() === authEmail);
        if (localMgmt) {
          mgmtUser = {
            id: localMgmt.id,
            name: localMgmt.name,
            email: localMgmt.email,
            phone: localMgmt.phone,
            username: localMgmt.username,
            role: localMgmt.role,
            account_status: localMgmt.accountStatus || 'active'
          };
          // Try to sync to cloud table in background
          void supabase.from('management_users').upsert({
            id: localMgmt.id,
            name: localMgmt.name,
            email: localMgmt.email,
            phone: localMgmt.phone || null,
            username: localMgmt.username,
            password: null,
            role: localMgmt.role || 'Talent Manager',
            account_status: localMgmt.accountStatus || 'active'
          }, { onConflict: 'email' });
        }
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

      // 2. Query influencers table (via secure RPC helper first, then direct query)
      let infUser: any = null;
      try {
        const { data: rpcInf, error: rpcInfErr } = await supabase.rpc('get_current_influencer_user');
        if (!rpcInfErr && rpcInf) {
          infUser = Array.isArray(rpcInf) ? rpcInf[0] : rpcInf;
        }
      } catch {
        // Fall back to direct query
      }

      if (!infUser) {
        const { data: tableInf, error: infErr } = await supabase
          .from('influencers')
          .select('*')
          .ilike('email', authEmail)
          .maybeSingle();

        if (infErr) {
          console.warn('Notice querying influencers:', infErr.message);
        }
        infUser = tableInf;
      }

      // Fallback: check local memory if cloud table hasn't synced this email yet
      if (!infUser) {
        const localInf = db.getInfluencers().find(inf => inf.email && inf.email.toLowerCase() === authEmail);
        if (localInf) {
          infUser = {
            id: localInf.id,
            name: localInf.name,
            handle: localInf.handle,
            email: localInf.email,
            username: localInf.username,
            avatar_url: localInf.avatarUrl,
            account_status: localInf.accountStatus || 'active'
          };
          // Try to sync to cloud table in background
          void supabase.from('influencers').upsert({
            id: localInf.id,
            name: localInf.name,
            handle: localInf.handle,
            city: localInf.city || null,
            avatar_url: localInf.avatarUrl || null,
            bio: localInf.bio || null,
            email: localInf.email,
            phone: localInf.phone || null,
            pan: localInf.pan || null,
            username: localInf.username,
            password: null,
            account_status: localInf.accountStatus || 'active',
            invoice_prefix: localInf.invoicePrefix || localInf.name.slice(0, 2).toUpperCase()
          }, { onConflict: 'id' });
        }
      }

      if (infUser) {
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
   * Resolves a username or handle to the registered email address.
   * Tries cloud RPC first, then local database fallback.
   */
  public async resolveUsernameToEmail(identifier: string): Promise<string | null> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;
    
    // An email has '@' but does NOT start with '@'
    if (!clean.startsWith('@') && clean.includes('@')) return clean;
    const cleanHandle = clean.replace(/^@/, '');

    // Explicit deterministic mapping for core system users
    if (clean === 'admin') {
      return 'admin@iyer.tech';
    }
    if (clean === 'siddharth') {
      return 'siddharthiyer.work@gmail.com';
    }
    if (clean === 'jdtech' || cleanHandle === 'jdtech' || cleanHandle === 'jdtech_official') {
      return 'collabs@jdtech.in';
    }

    // 1. Try Supabase RPC helper
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: rpcEmail, error: rpcErr } = await supabase.rpc('resolve_login_email', {
          p_identifier: clean
        });
        if (!rpcErr && rpcEmail && typeof rpcEmail === 'string' && rpcEmail.includes('@')) {
          const lowerRpc = rpcEmail.toLowerCase();
          if (clean !== 'admin' || lowerRpc !== 'siddharthiyer.work@gmail.com') {
            return lowerRpc;
          }
        }
      } catch {
        // Fall back to local storage
      }
    }

    // 2. Fallback: Check local management users
    const mgmtUsers = db.getManagementUsers();
    const mgmtMatch = mgmtUsers.find(
      u => (u.username.toLowerCase() === clean || u.username.toLowerCase() === cleanHandle || u.email.toLowerCase() === clean)
           && (clean !== 'admin' || u.email.toLowerCase() !== 'siddharthiyer.work@gmail.com')
    );
    if (mgmtMatch && mgmtMatch.email) {
      return mgmtMatch.email.toLowerCase();
    }

    // 3. Fallback: Check local influencers
    const influencers = db.getInfluencers();
    const infMatch = influencers.find(inf => {
      const infHandleWithoutAt = inf.handle.replace(/^@/, '').toLowerCase();
      const infUser = (inf.username || '').toLowerCase();
      return cleanHandle === infHandleWithoutAt || cleanHandle === infUser || clean === inf.handle.toLowerCase();
    });
    if (infMatch && infMatch.email) {
      return infMatch.email.toLowerCase();
    }

    return null;
  }

  /**
   * Authenticates against Supabase Auth only.
   * Plain-text/localStorage passwords are never used for authentication.
   */
  public async login(
    usernameOrEmail: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string; session?: AuthSession }> {
    const cleanInput = (usernameOrEmail || '').trim();
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

    // Resolve target email if user entered a username or handle
    let targetEmail = cleanInput.toLowerCase();
    let isKnownWorkspaceAccount = false;
    const isDirectEmail = !cleanInput.startsWith('@') && cleanInput.includes('@');

    if (!isDirectEmail) {
      const resolved = await this.resolveUsernameToEmail(cleanInput);
      if (resolved) {
        targetEmail = resolved;
        isKnownWorkspaceAccount = true;
      } else {
        return {
          success: false,
          message: 'Username not recognized. Please check your username or enter your registered email address.'
        };
      }
    } else {
      // Check if email exists in local records
      const mgmt = db.getManagementUsers().find(u => u.email.toLowerCase() === targetEmail);
      const inf = db.getInfluencers().find(i => i.email && i.email.toLowerCase() === targetEmail);
      if (mgmt || inf) {
        isKnownWorkspaceAccount = true;
      }
    }

    // Check pre-auth disabled status if found in local records
    const localMgmt = db.getManagementUsers().find(u => u.email.toLowerCase() === targetEmail);
    if (localMgmt && localMgmt.accountStatus === 'disabled') {
      return {
        success: false,
        message: 'Your management account has been disabled. Please contact system administrator.'
      };
    }

    const localInf = db.getInfluencers().find(i => i.email && i.email.toLowerCase() === targetEmail);
    if (localInf && localInf.accountStatus === 'disabled') {
      return {
        success: false,
        message: 'Your influencer creator workspace has been disabled. Please contact your talent manager.'
      };
    }

    try {
      // 1. Authenticate strictly with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass
      });

      if (authErr || !authData.user) {
        const errMsg = authErr?.message || '';
        const errCode = (authErr as any)?.code || '';

        if (errCode === 'invalid_credentials' || errMsg.toLowerCase().includes('invalid login credentials')) {
          if (isKnownWorkspaceAccount) {
            return {
              success: false,
              message: 'Invalid password. Please check your password and try again.'
            };
          }
          return {
            success: false,
            message: 'Invalid email or password. Please verify your credentials.'
          };
        }

        if (errMsg.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            message: 'Email address has not yet been confirmed. Please contact your administrator.'
          };
        }

        if (errCode === 'over_email_send_rate_limit' || errMsg.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            message: 'Too many login attempts. Please wait a moment and try again.'
          };
        }

        return {
          success: false,
          message: errMsg || 'Invalid credentials. Please check your email and password.'
        };
      }

      const authenticatedEmail = (authData.user.email || targetEmail).toLowerCase().trim();

      // 2. Load authenticated user's management_users record
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

      // Fallback: check local memory if cloud table hasn't synced this email yet
      if (!mgmtUser) {
        const localMgmtUser = db.getManagementUsers().find(u => u.email.toLowerCase() === authenticatedEmail);
        if (localMgmtUser) {
          mgmtUser = {
            id: localMgmtUser.id,
            name: localMgmtUser.name,
            email: localMgmtUser.email,
            phone: localMgmtUser.phone,
            username: localMgmtUser.username,
            role: localMgmtUser.role,
            account_status: localMgmtUser.accountStatus || 'active'
          };
          // Sync to cloud table
          void supabase.from('management_users').upsert({
            id: localMgmtUser.id,
            name: localMgmtUser.name,
            email: localMgmtUser.email,
            phone: localMgmtUser.phone || null,
            username: localMgmtUser.username,
            password: null,
            role: localMgmtUser.role || 'Talent Manager',
            account_status: localMgmtUser.accountStatus || 'active'
          }, { onConflict: 'email' });
        }
      }

      if (mgmtUser) {
        if (mgmtUser.account_status === 'disabled') {
          await supabase.auth.signOut();
          this.clearSession();
          return {
            success: false,
            message: 'Your management account has been disabled. Please contact system administrator.'
          };
        }

        // Owner/Partner/Talent Manager gets management/admin portal access
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
      let infUser: any = null;
      try {
        const { data: rpcInf, error: rpcInfErr } = await supabase.rpc('get_current_influencer_user');
        if (!rpcInfErr && rpcInf) {
          infUser = Array.isArray(rpcInf) ? rpcInf[0] : rpcInf;
        }
      } catch {
        // Fall back to direct query
      }

      if (!infUser) {
        const { data: tableInf, error: infErr } = await supabase
          .from('influencers')
          .select('*')
          .ilike('email', authenticatedEmail)
          .maybeSingle();

        if (infErr) {
          console.warn('Notice querying influencers:', infErr.message);
        }
        infUser = tableInf;
      }

      // Fallback: check local memory if cloud table hasn't synced this email yet
      if (!infUser) {
        const localInfUser = db.getInfluencers().find(i => i.email && i.email.toLowerCase() === authenticatedEmail);
        if (localInfUser) {
          infUser = {
            id: localInfUser.id,
            name: localInfUser.name,
            handle: localInfUser.handle,
            email: localInfUser.email,
            username: localInfUser.username,
            avatar_url: localInfUser.avatarUrl,
            account_status: localInfUser.accountStatus || 'active'
          };
          // Sync to cloud table
          void supabase.from('influencers').upsert({
            id: localInfUser.id,
            name: localInfUser.name,
            handle: localInfUser.handle,
            city: localInfUser.city || null,
            avatar_url: localInfUser.avatarUrl || null,
            bio: localInfUser.bio || null,
            email: localInfUser.email,
            phone: localInfUser.phone || null,
            pan: localInfUser.pan || null,
            username: localInfUser.username,
            password: null,
            account_status: localInfUser.accountStatus || 'active',
            invoice_prefix: localInfUser.invoicePrefix || localInfUser.name.slice(0, 2).toUpperCase()
          }, { onConflict: 'id' });
        }
      }

      if (infUser) {
        if (infUser.account_status === 'disabled') {
          await supabase.auth.signOut();
          this.clearSession();
          return {
            success: false,
            message: 'Your influencer creator workspace has been disabled. Please contact your talent manager.'
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
        message: 'No registered workspace profile found for this authenticated user. Please contact your administrator.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Authentication error occurred.'
      };
    }
  }

  /**
   * Admin-only method: Safely provisions or updates a Management / Admin user
   * via Supabase RPC and keeps local state synced.
   */
  public async provisionManagementUser(userData: {
    id?: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    phone?: string;
    role?: 'Owner' | 'Partner' | 'Talent Manager';
    accountStatus?: 'active' | 'disabled';
  }): Promise<{ success: boolean; message: string }> {
    const cleanEmail = userData.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'A valid email address is required.' };
    }

    // Check duplicate email in other accounts
    const allMgmt = db.getManagementUsers();
    const existingMgmt = allMgmt.find(u => u.email.toLowerCase() === cleanEmail && u.id !== userData.id);
    if (existingMgmt) {
      return { success: false, message: 'An account with this email address already exists in Management Users.' };
    }

    const allInf = db.getInfluencers();
    const existingInf = allInf.find(i => i.email && i.email.toLowerCase() === cleanEmail);
    if (existingInf) {
      return { success: false, message: 'An influencer account already exists with this email address.' };
    }

    const targetId = userData.id || 'mgmt-' + Date.now();
    const updatedRecord: ManagementUser = {
      id: targetId,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: userData.phone?.trim() || '',
      username: userData.username.trim(),
      password: '', // Plaintext passwords never stored in state
      role: userData.role || 'Talent Manager',
      accountStatus: userData.accountStatus || 'active'
    };

    // Save to local DB first
    db.saveManagementUser(updatedRecord);

    // Call Supabase Edge Function to provision in Supabase Auth & cloud table
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('admin-manage-credentials', {
          body: {
            action: 'provision_management_user',
            email: cleanEmail,
            password: userData.password?.trim(),
            name: updatedRecord.name,
            username: updatedRecord.username,
            phone: updatedRecord.phone,
            managementRole: updatedRecord.role,
            managementId: targetId
          }
        });

        if (edgeErr) {
          let msg = edgeErr.message;
          try {
            if ((edgeErr as any).context && typeof (edgeErr as any).context.json === 'function') {
              const body = await (edgeErr as any).context.json();
              if (body && body.message) msg = body.message;
            }
          } catch {}
          return { success: false, message: msg };
        } else if (edgeData && !edgeData.success) {
          return { success: false, message: edgeData.message || 'Failed to provision account in Supabase Auth.' };
        }
      } catch (err: any) {
        return { success: false, message: err.message || 'Error provisioning management account.' };
      }
    }

    return {
      success: true,
      message: `Management profile for "${updatedRecord.name}" successfully saved and provisioned.`
    };
  }

  /**
   * Admin-only method: Safely provisions or updates an Influencer creator account
   * via Supabase Edge Function and keeps local state synced.
   */
  public async provisionInfluencer(infData: {
    id?: string;
    name: string;
    handle: string;
    email: string;
    username: string;
    password?: string;
    city?: string;
    phone?: string;
    pan?: string;
    invoicePrefix?: string;
    bankDetails?: any;
    rateCard?: any;
    accountStatus?: 'active' | 'disabled';
  }): Promise<{ success: boolean; message: string }> {
    const cleanEmail = infData.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'A valid email address is required.' };
    }

    // Check duplicate email
    const allInf = db.getInfluencers();
    const existingInf = allInf.find(i => i.email && i.email.toLowerCase() === cleanEmail && i.id !== infData.id);
    if (existingInf) {
      return { success: false, message: 'An influencer account already exists with this email address.' };
    }

    const allMgmt = db.getManagementUsers();
    const existingMgmt = allMgmt.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingMgmt) {
      return { success: false, message: 'A management user already exists with this email address.' };
    }

    const targetId = infData.id || 'inf-' + Date.now();
    const autoPrefix = (infData.invoicePrefix?.trim() || infData.name.trim().slice(0, 2)).toUpperCase();

    const existingObj = infData.id ? db.getInfluencerById(infData.id) : undefined;
    const updatedRecord: Influencer = {
      id: targetId,
      name: infData.name.trim(),
      handle: infData.handle.startsWith('@') ? infData.handle.trim() : `@${infData.handle.trim()}`,
      city: infData.city?.trim() || 'India',
      avatarUrl: existingObj?.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
      bio: existingObj?.bio || 'Technology content creator and ecosystem product reviewer.',
      email: cleanEmail,
      phone: infData.phone?.trim() || '+91 98000 00000',
      pan: infData.pan?.trim().toUpperCase() || 'ABCDE1234F',
      username: infData.username.trim(),
      password: '', // Plaintext passwords never stored in state
      accountStatus: infData.accountStatus || 'active',
      address: existingObj?.address || 'Tech Park, India',
      invoicePrefix: autoPrefix,
      bankDetails: infData.bankDetails || existingObj?.bankDetails || {
        accountName: `${infData.name.trim()} Media`,
        bankName: 'HDFC Bank',
        accountNumber: '998877665544',
        ifsc: 'HDFC0000123',
        pan: 'ABCDE1234F'
      },
      rateCard: infData.rateCard || existingObj?.rateCard || {
        reel: 75000,
        collabReel: 95000,
        storeVisitReel: 110000,
        ugcVideo: 50000,
        story: 20000,
        carousel: 35000,
        adRights30d: 25000,
        adRights90d: 60000,
        adRights1y: 150000
      },
      monthlyInsightsSnapshots: existingObj?.monthlyInsightsSnapshots || []
    };

    // Save to local DB first
    db.saveInfluencer(updatedRecord);

    // Call Supabase Edge Function to provision in Supabase Auth & cloud table
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('admin-manage-credentials', {
          body: {
            action: 'provision_influencer',
            email: cleanEmail,
            password: infData.password?.trim(),
            name: updatedRecord.name,
            handle: updatedRecord.handle,
            username: updatedRecord.username,
            city: updatedRecord.city,
            phone: updatedRecord.phone,
            pan: updatedRecord.pan,
            invoicePrefix: updatedRecord.invoicePrefix,
            bankDetails: updatedRecord.bankDetails,
            rateCard: updatedRecord.rateCard,
            influencerId: targetId
          }
        });

        if (edgeErr) {
          let msg = edgeErr.message;
          try {
            if ((edgeErr as any).context && typeof (edgeErr as any).context.json === 'function') {
              const body = await (edgeErr as any).context.json();
              if (body && body.message) msg = body.message;
            }
          } catch {}
          return { success: false, message: msg };
        } else if (edgeData && !edgeData.success) {
          return { success: false, message: edgeData.message || 'Failed to provision influencer in Supabase Auth.' };
        }
      } catch (err: any) {
        return { success: false, message: err.message || 'Error provisioning creator account.' };
      }
    }

    return {
      success: true,
      message: `Influencer profile for "${updatedRecord.name}" successfully saved and provisioned.`
    };
  }

  /**
   * Resets password for an existing account via Supabase Edge Function
   */
  public async resetUserPassword(
    email: string,
    newPassword: string,
    role: 'ADMIN' | 'INFLUENCER',
    influencerId?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('admin-manage-credentials', {
          body: {
            action: 'reset_password',
            email: email.toLowerCase().trim(),
            newPassword: newPassword.trim(),
            role: role,
            influencerId: influencerId
          }
        });

        if (edgeErr) {
          let msg = edgeErr.message;
          try {
            if ((edgeErr as any).context && typeof (edgeErr as any).context.json === 'function') {
              const body = await (edgeErr as any).context.json();
              if (body && body.message) msg = body.message;
            }
          } catch {}
          return { success: false, message: msg };
        }

        if (edgeData && !edgeData.success) {
          return { success: false, message: edgeData.message || 'Error updating password.' };
        }

        return { success: true, message: `Password successfully updated in Supabase Auth for ${email}.` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Error updating password.' };
      }
    }

    return { success: true, message: `Password updated in local storage for ${email}.` };
  }

  /**
   * Updates login email for an existing account via Supabase Edge Function
   */
  public async updateUserEmail(
    oldEmail: string,
    newEmail: string,
    role: 'ADMIN' | 'INFLUENCER'
  ): Promise<{ success: boolean; message: string }> {
    if (!newEmail || !newEmail.includes('@')) {
      return { success: false, message: 'A valid new email address is required.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('admin-manage-credentials', {
          body: {
            action: 'update_email',
            email: oldEmail.toLowerCase().trim(),
            newEmail: newEmail.toLowerCase().trim(),
            role: role
          }
        });

        if (edgeErr) {
          return { success: false, message: `Edge function error: ${edgeErr.message}` };
        }

        if (edgeData && !edgeData.success) {
          return { success: false, message: edgeData.message || 'Error updating email.' };
        }

        return { success: true, message: `Email updated from ${oldEmail} to ${newEmail}.` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Error updating email.' };
      }
    }

    return { success: true, message: `Email updated locally for ${newEmail}.` };
  }

  /**
   * Syncs all workspace profiles from local state into Supabase tables
   */
  public async syncAllProfilesToCloud(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, message: 'Supabase credentials are not configured.' };
    }

    try {
      const mgmtUsers = db.getManagementUsers();
      if (mgmtUsers.length > 0) {
        await supabase.from('management_users').upsert(
          mgmtUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || null,
            username: u.username,
            password: null,
            role: u.role || 'Talent Manager',
            account_status: u.accountStatus || 'active'
          })),
          { onConflict: 'email' }
        );
      }

      const influencers = db.getInfluencers();
      if (influencers.length > 0) {
        await supabase.from('influencers').upsert(
          influencers.map(inf => ({
            id: inf.id,
            name: inf.name,
            handle: inf.handle,
            city: inf.city || null,
            avatar_url: inf.avatarUrl || null,
            bio: inf.bio || null,
            email: inf.email || null,
            phone: inf.phone || null,
            pan: inf.pan || null,
            username: inf.username,
            password: null,
            account_status: inf.accountStatus || 'active',
            address: inf.address || null,
            bank_details: inf.bankDetails || {},
            rate_card: inf.rateCard || {},
            invoice_prefix: inf.invoicePrefix || inf.name.slice(0, 2).toUpperCase()
          })),
          { onConflict: 'id' }
        );
      }

      return { success: true, message: 'Successfully synced all workspace profiles to cloud tables.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error syncing profiles.' };
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
