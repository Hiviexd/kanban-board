'use client';

import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import ProtectedRoute from '@/components/auth/protected-route';
import { Plus, Kanban, Users, Calendar } from 'lucide-react';

// Dummy board data for now
const dummyBoards = [
  {
    id: '1',
    title: 'Project Alpha',
    description: 'Main development project for Q1',
    memberCount: 5,
    lastActivity: '2 hours ago',
    isPublic: false,
  },
  {
    id: '2', 
    title: 'Marketing Campaign',
    description: 'Spring marketing campaign planning',
    memberCount: 3,
    lastActivity: '1 day ago',
    isPublic: true,
  },
  {
    id: '3',
    title: 'Bug Tracking',
    description: 'Track and fix reported bugs',
    memberCount: 7,
    lastActivity: '3 hours ago',
    isPublic: false,
  }
];

export default function BoardsPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Boards</h1>
              <p className="text-muted-foreground">
                Manage and organize your kanban boards
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Boards</p>
                  <p className="text-2xl font-bold">{dummyBoards.length}</p>
                </div>
                <Kanban className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">
                    {dummyBoards.reduce((acc, board) => acc + board.memberCount, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Boards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyBoards.map((board) => (
              <div
                key={board.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {board.title}
                  </h3>
                  {board.isPublic && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Public
                    </span>
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {board.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{board.memberCount} members</span>
                  </div>
                  <span>{board.lastActivity}</span>
                </div>
              </div>
            ))}

            {/* Create New Board Card */}
            <div className="bg-card border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="bg-primary/10 rounded-full p-3 mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Create New Board</h3>
              <p className="text-sm text-muted-foreground">
                Start a new project and invite your team
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
