import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const query = trpc.auth.me.useQuery(undefined, { retry: false });
  const [localOwner, setLocalOwner] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sakina:is_owner") === "true";
    } catch {
      return false;
    }
  });

  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        localStorage.removeItem("sakina:is_owner");
      } catch {}
      setLocalOwner(false);
      utils.auth.me.invalidate();
    },
  });

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("sakina:is_owner");
    } catch {}
    setLocalOwner(false);
    logoutMutation.mutate();
  }, [logoutMutation]);

  const isOwner = Boolean(query.data?.isOwner || localOwner);
  const user = query.data
    ? query.data
    : isOwner
      ? {
          id: 1,
          name: "مالكة سكينة",
          email: "owner@sakina.store",
          isOwner: true,
          role: "admin" as const,
          openId: "owner-local",
          loginMethod: "local",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null;

  return {
    user,
    loading: query.isLoading && !localOwner,
    error: query.error ?? null,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}

export default useAuth;
