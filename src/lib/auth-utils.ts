import { auth0 } from './auth0';
import connectDB from './mongodb';
import User, { IUser } from './models/User';
import { UserRole, UserStatus } from './types/user';

export interface AuthContext {
  user: IUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBanned: boolean;
}

/**
 * Get the current user's authentication context
 */
export async function getAuthContext(): Promise<AuthContext> {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isBanned: false,
      };
    }

    await connectDB();

    // Find user in database
    const user = await User.findOne({ auth0Id: session.user.sub });

    if (!user) {
      return {
        user: null,
        isAuthenticated: true, // Authenticated in Auth0 but not in our DB
        isAdmin: false,
        isBanned: false,
      };
    }

    return {
      user,
      isAuthenticated: true,
      isAdmin: user.role === UserRole.ADMIN,
      isBanned: user.status === UserStatus.BANNED,
    };
  } catch (error) {
    console.error('Error getting auth context:', error);
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isBanned: false,
    };
  }
}

/**
 * Sync user data from Auth0 to our database
 */
export async function syncUserFromAuth0() {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return null;
    }

    await connectDB();

    const { sub: auth0Id, email, name, picture } = session.user;

    let user = await User.findOne({ auth0Id });

    if (user) {
      // Update existing user
      user.email = email;
      user.name = name;
      user.picture = picture;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        auth0Id,
        email,
        name,
        picture,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
      });
      await user.save();
    }

    return user;
  } catch (error) {
    console.error('Error syncing user from Auth0:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export async function requireRole(requiredRole: UserRole): Promise<boolean> {
  const { isAuthenticated, user } = await getAuthContext();
  
  if (!isAuthenticated || !user) {
    return false;
  }

  // Admin can access everything
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  return user.role === requiredRole;
}

/**
 * Check if user is admin
 */
export async function requireAdmin(): Promise<boolean> {
  return requireRole(UserRole.ADMIN);
}
