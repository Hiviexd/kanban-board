import MainLayout from "@/components/layout/main-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import BoardsContent from "@/components/boards/boards-content";
import { getBoards } from "@/lib/services/boards";

export default async function BoardsPage() {
    // Fetch boards data on the server
    const boards = await getBoards();

    return (
        <MainLayout>
            <ProtectedRoute>
                <BoardsContent boards={boards} />
            </ProtectedRoute>
        </MainLayout>
    );
}
