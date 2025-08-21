import { BoardDisplay } from "@/lib/types/board";

export async function getBoards(): Promise<BoardDisplay[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return [
        {
            _id: "1",
            title: "Project Alpha",
            description: "Main development project for Q1",
            memberCount: 5,
            lastActivity: "2 hours ago",
            isPublic: false,
        },
        {
            _id: "2",
            title: "Marketing Campaign",
            description: "Spring marketing campaign planning",
            memberCount: 3,
            lastActivity: "1 day ago",
            isPublic: true,
        },
        {
            _id: "3",
            title: "Bug Tracking",
            description: "Track and fix reported bugs",
            memberCount: 7,
            lastActivity: "3 hours ago",
            isPublic: false,
        },
    ];
}
