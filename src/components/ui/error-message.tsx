import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
}

export default function ErrorMessage({ message, onRetry, retryLabel = "Try again" }: ErrorMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="mb-4 p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>

            <p className="text-muted-foreground mb-6">{message}</p>

            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {retryLabel}
                </Button>
            )}
        </div>
    );
}
