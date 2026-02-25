"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const DynamicChart = dynamic(
    () => import("./DynamicChart").then((mod) => mod.DynamicChart),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[300px] flex items-center justify-center bg-card/10 rounded-3xl border border-border/50">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        ),
    }
);
