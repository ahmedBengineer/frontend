"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { WorkflowStudio } from "@/components/workflow-editor/WorkflowStudio";

export default function WorkflowStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[620px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      }
    >
      <WorkflowStudio />
    </Suspense>
  );
}
