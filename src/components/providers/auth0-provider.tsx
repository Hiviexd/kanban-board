"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";

interface Auth0ProviderProps {
    children: ReactNode;
}

export default function Auth0ProviderWrapper({ children }: Auth0ProviderProps) {
    return <Auth0Provider>{children}</Auth0Provider>;
}
