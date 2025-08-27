import { BoardWithMetadata } from "@/lib/types/board";

export async function getBoards(): Promise<BoardWithMetadata[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return [
        {
            _id: "1",
            title: "Project Alpha",
            description: "Main development project for Q1",
            ownerId: "current-user-id",
            members: [],
            labels: [],
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            memberCount: 5,
            lastActivity: "2 hours ago",
            canEdit: true,
            canView: true,
        },
        {
            _id: "2",
            title: "Marketing Campaign",
            description: "Spring marketing campaign planning",
            ownerId: "current-user-id",
            members: [],
            labels: [],
            isPublic: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            memberCount: 3,
            lastActivity: "1 day ago",
            canEdit: true,
            canView: true,
        },
        {
            _id: "3",
            title: "Bug Tracking",
            description: "Track and fix reported bugs",
            ownerId: "current-user-id",
            members: [],
            labels: [],
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            memberCount: 7,
            lastActivity: "3 hours ago",
            canEdit: true,
            canView: true,
        },
    ];
}
