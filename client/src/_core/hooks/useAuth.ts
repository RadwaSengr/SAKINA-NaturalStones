import { trpc } from "@/lib/trpc";

export function useAuth() {
  const query = trpc.auth.me.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}

export default useAuth;
