"use client";

import { useUser } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Kanban, LogOut, Settings, User, Users } from "lucide-react";
import { UserRole } from "@/lib/types/user";

export default function Header() {
    const { user, isLoading } = useUser();

    console.log(user);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center space-x-2 ml-4">
                    <Kanban className="h-6 w-6" />
                    <span className="font-bold text-xl">KanbanBoard</span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center space-x-4">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* User Authentication */}
                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-muted"></div>
                        </div>
                    ) : user ? (
                        <div className="flex items-center space-x-4">
                            {/* Boards Link */}
                            <Button variant="ghost" asChild>
                                <Link href="/boards">
                                    <Kanban className="h-4 w-4 mr-2" />
                                    Boards
                                </Link>
                            </Button>

                            {/* Admin Link */}
                            {user?.role === UserRole.ADMIN && (
                                <Button variant="ghost" asChild>
                                    <Link href="/admin">
                                        <Users className="h-4 w-4 mr-2" />
                                        Admin
                                    </Link>
                                </Button>
                            )}

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full border border-gray-300">
                                        <div className="flex items-center justify-center w-full h-full rounded-full bg-muted">
                                            <User className="h-4 w-4" />
                                        </div>

                                        <span className="sr-only">Open user menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <a href="/auth/logout">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Button asChild>
                            <a href="/auth/login">Log in</a>
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}
