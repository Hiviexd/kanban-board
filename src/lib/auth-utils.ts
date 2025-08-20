import { auth0 } from "./auth0";
import connectDB from "./mongodb";
import User, { IUser } from "./models/User";
import { UserRole, UserStatus } from "./types/user";

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
        let user = await User.findOne({ auth0Id: session.user.sub });

        if (!user) {
            console.log("User not found in database, attempting to sync from Auth0...");
            // User doesn't exist in our database yet, try to sync them
            user = await syncUserFromAuth0();

            if (!user) {
                console.error("Failed to sync user from Auth0 in getAuthContext");
                return {
                    user: null,
                    isAuthenticated: true, // Authenticated in Auth0 but not in our DB
                    isAdmin: false,
                    isBanned: false,
                };
            }
        }

        return {
            user,
            isAuthenticated: true,
            isAdmin: user.role === UserRole.ADMIN,
            isBanned: user.status === UserStatus.BANNED,
        };
    } catch (error) {
        console.error("Error getting auth context:", error);
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
            console.log("No Auth0 session found in syncUserFromAuth0");
            return null;
        }

        console.log("Auth0 session found, connecting to database...");
        await connectDB();

        const { sub: auth0Id, email, name, picture } = session.user;

        if (!auth0Id || !email) {
            console.error("Missing required Auth0 user data:", { auth0Id, email });
            return null;
        }

        console.log("Looking for existing user with auth0Id:", auth0Id);
        let user = await User.findOne({ auth0Id });

        if (user) {
            console.log("User found, updating:", user.email);
            // Update existing user
            user.email = email;
            user.name = name || user.name;
            user.picture = picture;
            user.lastLoginAt = new Date();
            await user.save();
            console.log("User updated successfully");
        } else {
            console.log("User not found, creating new user for:", email);
            // Create new user
            user = new User({
                auth0Id,
                email,
                name: name || email.split("@")[0], // Fallback name if not provided
                picture,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                lastLoginAt: new Date(),
            });
            await user.save();
            console.log("New user created successfully:", user.email);
        }

        return user;
    } catch (error) {
        console.error("Error syncing user from Auth0:", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Error stack:", error.stack);
        }
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
