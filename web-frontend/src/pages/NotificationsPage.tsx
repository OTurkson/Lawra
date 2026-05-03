import { Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => (queryClient.getQueryData(["notifications", user?.id]) ?? []) as any[],
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light text-foreground">Notification</h2>
        <span className="text-sm text-muted-foreground">Recent</span>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 && (
          <div className="text-sm text-muted-foreground">No recent activity.</div>
        )}

        {notifications.map((notif: any) => (
          <div
            key={notif.id}
            className="bg-card rounded-lg shadow-sm p-5 flex items-start gap-4 border-l-4 border-primary"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bell size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
              <p className="text-xs text-muted-foreground/70 mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
