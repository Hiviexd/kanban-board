import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/main-layout";
import { Kanban, Users, Zap } from "lucide-react";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function Home() {
    const authContext = await getAuthContext();

    if (authContext.isAuthenticated) {
        if (authContext.isAdmin) redirect("/admin");
        else redirect("/boards");
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Collaborative Kanban Board
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        The prime way to manage your projects and tasks.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" asChild>
                            <a href="/auth/login">Get Started</a>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/boards">View Boards</Link>
                        </Button>
                    </div>
                </div>

                {/* Features Section */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="text-center p-6 border rounded-lg">
                        <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Kanban className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Kanban Boards</h3>
                        <p className="text-muted-foreground">
                            Organize tasks with intuitive drag-and-drop kanban boards
                        </p>
                    </div>

                    <div className="text-center p-6 border rounded-lg">
                        <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
                        <p className="text-muted-foreground">Work together with your team in real-time</p>
                    </div>

                    <div className="text-center p-6 border rounded-lg">
                        <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">User Management</h3>
                        <p className="text-muted-foreground">Role-based permissions and user administration</p>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center bg-muted/50 rounded-lg p-8">
                    <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
                    <p className="text-muted-foreground mb-6">Sign up now and start organizing your projects!</p>
                    <Button size="lg" asChild variant="outline">
                        <a href="/auth/login">Sign Up Now</a>
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}
