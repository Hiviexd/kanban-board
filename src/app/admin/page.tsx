'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/main-layout';
import ProtectedRoute from '@/components/auth/protected-route';
import { UserRole, UserStatus, User } from '@/lib/types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Ban, 
  MoreHorizontal, 
  TrendingUp, 
  Eye, 
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  adminUsers: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    adminUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch users: ${response.status} ${errorData.error || ''}`);
      }
      
      const data = await response.json();
      setUsers(data.users);
      
      // Calculate stats
      const newStats = {
        totalUsers: data.users.length,
        activeUsers: data.users.filter((u: User) => u.status === UserStatus.ACTIVE).length,
        bannedUsers: data.users.filter((u: User) => u.status === UserStatus.BANNED).length,
        adminUsers: data.users.filter((u: User) => u.role === UserRole.ADMIN).length,
      };
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle user ban status
  const toggleUserBan = async (userId: string, currentStatus: UserStatus) => {
    try {
      setActionLoading(userId);
      
      const newStatus = currentStatus === UserStatus.ACTIVE 
        ? UserStatus.BANNED 
        : UserStatus.ACTIVE;
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(userId);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string | Date) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return formatDate(date);
  };
  const getRoleBadgeVariant = (role: UserRole) => {
    return role === UserRole.ADMIN ? 'destructive' : 'secondary';
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    return status === UserStatus.ACTIVE ? 'default' : 'destructive';
  };

  if (loading) {
    return (
      <MainLayout>
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading admin dashboard...</p>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage users, roles, and system statistics
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.bannedUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.bannedUsers > 0 ? 'Requires attention' : 'All users active'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adminUsers}</div>
                <p className="text-xs text-muted-foreground">
                  System administrators
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all registered users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(user.lastLoginAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                disabled={actionLoading === user._id}
                              >
                                {actionLoading === user._id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => alert(`User Details:\nID: ${user._id}\nAuth0 ID: ${user.auth0Id}\nCreated: ${formatDate(user.createdAt)}\nLast Login: ${formatRelativeTime(user.lastLoginAt)}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              
                              {/* Role change options */}
                              {user.role !== UserRole.ADMIN && (
                                <DropdownMenuItem 
                                  onClick={() => updateUserRole(user._id, UserRole.ADMIN)}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              {user.role !== UserRole.USER && (
                                <DropdownMenuItem 
                                  onClick={() => updateUserRole(user._id, UserRole.USER)}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make User
                                </DropdownMenuItem>
                              )}
                              
                              {/* Ban/Unban option */}
                              <DropdownMenuItem 
                                onClick={() => toggleUserBan(user._id, user.status)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {user.status === UserStatus.ACTIVE ? 'Ban User' : 'Unban User'}
                              </DropdownMenuItem>
                              
                              {/* Delete option */}
                              <DropdownMenuItem 
                                onClick={() => deleteUser(user._id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
