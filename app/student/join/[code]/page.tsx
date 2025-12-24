"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StudentJoinDirectPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    useEffect(() => {
        if (code) {
            // Auto redirect to waiting room
            router.push(`/student/waiting-room/${code}`);
        } else {
            router.push("/student/join");
        }
    }, [code, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-purple-600">
            <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                <span className="font-medium">Đang tham gia phòng thi...</span>
            </div>
        </div>
    );
}
