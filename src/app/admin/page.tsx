import { redirect } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';
import AdminDashboard from '@/components/admin/admin-dashboard';
import { getAuthContext } from '@/lib/auth-utils';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { User as UserType, UserRole, UserStatus } from '@/lib/types/user';

// Server component - SSR with route protection
export default async function AdminPage() {
  // Check authentication and admin access server-side
  const authContext = await getAuthContext();
  
  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect('/auth/login');
  }
  
  // Redirect if not admin
  if (!authContext.isAdmin) {
    redirect('/'); // Redirect to home page for non-admins
  }

  // Fetch users server-side for initial data
  let users: UserType[] = [];
  try {
    await connectDB();
    const userDocs = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    // Convert MongoDB documents to plain objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users = (userDocs as any[]).map((user): UserType => ({
      _id: user._id.toString(),
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture || undefined,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch users server-side:', error);
    // Continue with empty array - client will show error and allow retry
  }

  return (
    <MainLayout>
      <AdminDashboard initialUsers={users} />
    </MainLayout>
  );
}
