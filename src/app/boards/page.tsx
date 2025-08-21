import MainLayout from "@/components/layout/main-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import BoardsContent from "@/components/boards/boards-content";

export default async function BoardsPage() {
    return (
        <MainLayout>
            <ProtectedRoute>
                <BoardsContent />
            </ProtectedRoute>
        </MainLayout>
    );
}
