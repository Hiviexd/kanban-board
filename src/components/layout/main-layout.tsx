import { ReactNode } from "react";
import Header from "./header";
import { getAuthContext } from "@/lib/auth-utils";

interface MainLayoutProps {
    children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
    const authContext = await getAuthContext();
    return (
        <div className="relative flex min-h-screen flex-col">
            <Header user={authContext.user} />
            <main className="flex-1">{children}</main>
        </div>
    );
}
