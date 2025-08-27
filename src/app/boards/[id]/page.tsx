import { notFound } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import BoardDetailLayout from "@/components/boards/board-detail-layout";

interface BoardDetailPageProps {
    params: {
        id: string;
    };
}

export default function BoardDetailPage({ params }: BoardDetailPageProps) {
    const boardId = params.id;

    // Validate boardId format (basic check for ObjectId)
    if (!boardId || !/^[a-fA-F0-9]{24}$/.test(boardId)) {
        notFound();
    }

    return (
        <MainLayout>
            <ProtectedRoute>
                <BoardDetailLayout boardId={boardId} />
            </ProtectedRoute>
        </MainLayout>
    );
}

// Optional: Add metadata generation
export async function generateMetadata({ params }: BoardDetailPageProps) {
    const boardId = params.id;

    // In a real app, you might fetch the board title here for better SEO
    // For now, we'll use a generic title
    return {
        title: `Board - Mobelite`,
        description: "Collaborative project management board",
    };
}
