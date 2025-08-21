import { Kanban, Users, Calendar } from "lucide-react";
import { BoardDisplay } from "@/lib/types/board";

interface BoardsStatsProps {
    boards: BoardDisplay[];
}

export default function BoardsStats({ boards }: BoardsStatsProps) {
    const totalMembers = boards.reduce((acc, board) => acc + board.memberCount, 0);
    const activeToday = boards.filter(
        (board) => board.lastActivity.includes("hour") || board.lastActivity.includes("today")
    ).length;

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
