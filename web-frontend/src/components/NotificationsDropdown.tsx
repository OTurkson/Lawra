import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useEffect } from "react";
import type { Notification } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => (queryClient.getQueryData(["notifications", user?.id]) ?? []) as any[],
    enabled: !!user?.id,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  }, [user?.id, queryClient]);

  const recentNotifications = notifications.slice(0, 5);
  const hasUnreadNotifications = notifications.some((notification: Notification) => !notification.read);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open && user?.id) {
      queryClient.setQueryData<Notification[]>(["notifications", user.id], (current = []) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View notifications"
        >
          <Bell size={20} />
          {hasUnreadNotifications && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            No recent activity
          </div>
        ) : (
          <>
            {recentNotifications.map((notif: any) => (
              <div
                key={notif.id}
                className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-default"
              >
                <p className="text-sm text-foreground leading-relaxed">{notif.message}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
            {notifications.length > 5 && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border bg-muted/20">
                +{notifications.length - 5} more
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
