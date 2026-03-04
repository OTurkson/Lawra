import { Bell } from "lucide-react";

const notifications = [
  {
    type: "loan",
    message: "A loan application has been completed and sent by Nana Yaw of Staff No. 1738.",
  },
  {
    type: "bank",
    message: "A virtual bank has been created by Fred Offei, with an amount of Ghc 2,000 of Staff No. 1819.",
  },
];

const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light text-foreground">Notification</h2>
        <span className="text-sm text-muted-foreground">Q&A</span>
      </div>

      <div className="space-y-4">
        {notifications.map((notif, i) => (
          <div
            key={i}
            className="bg-card rounded-lg shadow-sm p-5 flex items-start gap-4 border-l-4 border-primary"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bell size={20} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
