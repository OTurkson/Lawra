import { useQuery } from "@tanstack/react-query";
import { fetchUserById, UserResponse } from "@/lib/api";
import { getAuth } from "@/lib/auth";

export function useCurrentUser() {
  const auth = getAuth();

  const query = useQuery<UserResponse | null>({
    queryKey: ["current-user", auth?.userId],
    queryFn: async () => {
      if (!auth?.userId) return null;
      return fetchUserById(auth.userId);
    },
    enabled: !!auth?.userId,
  });

  return {
    ...query,
    user: query.data ?? null,
  };
}
