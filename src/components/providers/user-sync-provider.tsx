"use client";

import { useUser } from "@auth0/nextjs-auth0";
import { useEffect, useState } from "react";

export default function UserSyncProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useUser();
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        const syncUser = async () => {
            if (user && !synced && !isLoading) {
                try {
                    console.log("Syncing user globally:", user.email);
                    const response = await fetch("/api/users", {
                        method: "POST",
                    });

                    if (response.ok) {
                        console.log("User synced successfully");
                        setSynced(true);
                    } else {
                        console.error("Failed to sync user:", response.status);
                    }
                } catch (error) {
                    console.error("Error syncing user:", error);
                }
            }
        };

        syncUser();
    }, [user, isLoading, synced]);

    // Reset sync status when user changes (logout/login)
    useEffect(() => {
        if (!user) {
            setSynced(false);
        }
    }, [user]);

    return <>{children}</>;
}
