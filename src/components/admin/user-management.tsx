'use client';

import { useState } from 'react';
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
  MoreHorizontal, 
  Eye, 
  Shield, 
  Ban, 
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, UserStatus } from '@/lib/types/user';

interface UserManagementProps {
  initialUsers: User[];
  onUsersUpdate?: (users: User[]) => void;
}

export default function UserManagement({ initialUsers, onUsersUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update users and notify parent
  const updateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    onUsersUpdate?.(newUsers);
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch users: ${response.status} ${errorData.error || ''}`);
      }
      
      const data = await response.json();
      updateUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      setError(null);
      
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
      setError(null);
      
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
      setError(null);
      
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage all registered users and their permissions
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchUsers} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 border border-destructive rounded-md">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

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
  );
}
