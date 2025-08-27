import { Kanban, Users, Calendar } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";

export default function BoardsStats() {
    const { data: boards = [] } = useBoards();
    const totalMembers = boards.reduce((acc, board) => acc + board.memberCount, 0);
    const activeToday = boards.filter((board) => {
        if (!board.lastActivity) return false;
        if (typeof board.lastActivity === "string") {
            return board.lastActivity.includes("hour") || board.lastActivity.includes("today");
        }
        // If it's a Date, check if it's today
        const today = new Date();
        const activityDate = board.lastActivity;
        return activityDate.toDateString() === today.toDateString();
    }).length;

    return (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Boards</p>
                        <p className="text-2xl font-bold">{boards.length}</p>
                    </div>
                    <Kanban className="h-8 w-8 text-muted-foreground" />
                </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                        <p className="text-2xl font-bold">{totalMembers}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                        <p className="text-2xl font-bold">{activeToday}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}
