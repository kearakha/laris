"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/authStore";

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: "/superadmin/tenants",
  tenant_owner: "/outlet/dashboard",
  outlet_manager: "/outlet/pos",
  supervisor: "/outlet/pos",
  kasir: "/outlet/pos",
  inventory_staff: "/outlet/inventory",
  kitchen_staff: "/outlet/kds",
};

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginForm) => authApi.login(data),
    onSuccess: ({ data }) => {
      const { token, user } = data.data;
      setAuth(token, user);

      // Set cookie for middleware
      document.cookie = `laris_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      const role = user.roles[0] ?? "kasir";
      const redirect = ROLE_REDIRECTS[role] ?? "/login";
      router.push(redirect);
      toast.success(`Selamat datang, ${user.name}!`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ??
          "Login gagal. Periksa email dan password.",
      );
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-2 text-3xl font-bold text-primary">
            LARIS
          </div>
          <CardTitle className="text-2xl">Masuk ke Akun</CardTitle>
          <CardDescription>
            Layanan, Antrian, Reservasi, Inventory & Sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@larisapp.id"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <div className="mt-6 rounded-lg bg-muted p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Akun Demo</p>
            <p>
              Tenant Owner: <span className="font-mono">demo@laris.app</span>
            </p>
            <p>
              Kasir: <span className="font-mono">kasir@laris.app</span>
            </p>
            <p>
              Password: <span className="font-mono">demo1234</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
