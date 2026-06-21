"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/superadmin/PlanForm";
import { usePlan, useUpdatePlan } from "@/lib/hooks/usePlans";

export default function EditPlanPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const planId = parseInt(id);
  const { data, isLoading } = usePlan(planId);
  const { mutate, isPending } = useUpdatePlan(planId);

  const plan = data?.data;

  if (isLoading)
    return <div className="text-muted-foreground">Memuat data plan...</div>;
  if (!plan)
    return <div className="text-destructive">Plan tidak ditemukan.</div>;

  return (
    <div>
      <Header title={`Edit Plan: ${plan.name}`}>
        <Button variant="ghost" asChild>
          <Link href="/superadmin/plans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </Header>

      <PlanForm
        defaultValues={plan}
        onSubmit={(data) =>
          mutate(data, { onSuccess: () => router.push("/superadmin/plans") })
        }
        isPending={isPending}
      />
    </div>
  );
}
