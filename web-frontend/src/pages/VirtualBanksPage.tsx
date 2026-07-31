import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteVirtualBank,
  fetchVirtualBanks,
  topUpVirtualBank,
  updateVirtualBank,
  VirtualBank,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Spinner } from "@/components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pushNotification } from "@/lib/notifications";
import { normalizeRole } from "@/lib/auth";
import { formatNumberInput, parseAmount } from "@/lib/format-number";
import { Eye, EyeOff } from "lucide-react";

const VirtualBanksPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role);
  const isAdmin = role === "ADMIN";
  const isTenantAdmin = isAdmin || role === "PAYMASTER";
  const isBorrower = role === "BORROWER";

  const [showBalances, setShowBalances] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [renameName, setRenameName] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    data: banks,
    isLoading: isBanksLoading,
    isError: isBanksError,
    error: banksError,
  } = useQuery<VirtualBank[]>({
    queryKey: ["virtual-banks"],
    queryFn: fetchVirtualBanks,
  });

  const visibleBanks = useMemo(() => {
    if (isBorrower) {
      return (banks ?? []).filter((bank) => bank.createdById === user?.id);
    }

    if (isTenantAdmin) {
      return banks ?? [];
    }

    return [];
  }, [banks, isBorrower, isTenantAdmin, user?.id]);

  const selectedBank = visibleBanks.find((bank) => String(bank.id) === selectedBankId);
  const isSelectedBankOwner = !!selectedBank && selectedBank.createdById === user?.id;
  const canManageSelectedBank = !!selectedBank && (isTenantAdmin || isSelectedBankOwner);
  const shouldShowBalances = !isTenantAdmin || showBalances;

  const formatDateTime = (value?: string) => {
    if (!value) {
      return "-";
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  };

  const renderBanksTable = (options: { showCreatedBy: boolean; emptyMessage: string }) => (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 pb-2 border-b border-border">
        <h2 className="text-lg font-light text-foreground">Virtual Banks</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {options.showCreatedBy ? "Click a bank to manage it." : "Only banks created by you are shown here. Click one to see its balance and edit details."}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-table-header text-table-header-foreground">
            <th className="px-4 py-2 text-left font-normal">Name</th>
            <th className="px-4 py-2 text-center font-normal">
              <span className="inline-flex items-center gap-1">
                Balance
                {isTenantAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowBalances((visible) => !visible)}
                    className="rounded p-1 hover:bg-muted/50"
                    title={showBalances ? "Hide balances" : "Show balances"}
                    aria-label={showBalances ? "Hide balances" : "Show balances"}
                  >
                    {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </span>
            </th>
            {options.showCreatedBy && <th className="px-4 py-2 text-center font-normal">Created By</th>}
          </tr>
        </thead>
        <tbody>
          {isBanksLoading && (
            <tr className="border-b border-border">
              <td className="px-4 py-2 text-muted-foreground" colSpan={options.showCreatedBy ? 3 : 2}>
                Loading virtual banks...
              </td>
            </tr>
          )}

          {!isBanksLoading && isBanksError && (
            <tr className="border-b border-border">
              <td className="px-4 py-2 text-destructive text-center" colSpan={options.showCreatedBy ? 3 : 2}>
                {(banksError as Error)?.message ?? "Unable to load virtual banks."}
              </td>
            </tr>
          )}

          {!isBanksLoading && !isBanksError && visibleBanks.map((bank) => (
            <tr
              key={bank.id}
              className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/30 ${String(bank.id) === selectedBankId ? "bg-muted/40" : ""}`}
              onClick={() => {
                setSelectedBankId(String(bank.id));
                setRenameName(bank.name ?? "");
                setTopUpAmount("");
                setIsBankDialogOpen(true);
              }}
            >
              <td className="px-4 py-2 text-muted-foreground">{bank.name ?? "-"}</td>
              <td className="px-4 py-2 text-center text-muted-foreground">{shouldShowBalances ? bank.balance ?? "-" : "••••••"}</td>
              {options.showCreatedBy && <td className="px-4 py-2 text-center text-muted-foreground">{bank.createdBy ?? "-"}</td>}
            </tr>
          ))}

          {!isBanksLoading && !isBanksError && visibleBanks.length === 0 && (
            <tr className="border-b border-border">
              <td className="px-4 py-2 text-muted-foreground text-center" colSpan={options.showCreatedBy ? 3 : 2}>
                {options.emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedBank) throw new Error("Select a virtual bank to rename.");
      if (!canManageSelectedBank) throw new Error("You can only rename virtual banks created by you.");
      if (!renameName.trim()) throw new Error("Bank name is required.");
      return updateVirtualBank(selectedBank.id, { name: renameName.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      toast({ title: "Virtual bank updated" });
      pushNotification(queryClient, user?.id, { type: 'bank-rename', message: `Renamed virtual bank to ${renameName}` });
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error?.message ?? "Unable to update virtual bank." });
    },
  });

  const topUpMutation = useMutation({
    mutationFn: () => {
      if (!selectedBank) throw new Error("Select a virtual bank to top up.");
      if (!canManageSelectedBank) throw new Error("You can only top up virtual banks created by you.");
      const amount = Number(parseAmount(topUpAmount));
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Top-up amount must be greater than zero.");
      return topUpVirtualBank(selectedBank.id, { amount });
    },
    onSuccess: () => {
      setTopUpAmount("");
      setIsBankDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      queryClient.invalidateQueries({ queryKey: ["current-user", user?.id] });
      toast({ title: "Top-up successful" });
      pushNotification(queryClient, user?.id, { type: 'bank-topup', message: `Topped up ${selectedBank?.name} with Gh¢ ${Number(topUpAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
    },
    onError: (error: any) => {
      toast({ title: "Top-up failed", description: error?.message ?? "Unable to top up virtual bank." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selectedBank) throw new Error("Select a virtual bank to delete.");
      if (!canManageSelectedBank) throw new Error("You can only delete virtual banks created by you.");
      return deleteVirtualBank(selectedBank.id);
    },
    onSuccess: () => {
      setSelectedBankId("");
      setRenameName("");
      setTopUpAmount("");
      setIsBankDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      queryClient.invalidateQueries({ queryKey: ["current-user", user?.id] });
      toast({ title: "Virtual bank deleted" });
      pushNotification(queryClient, user?.id, { type: 'bank-delete', message: `Deleted virtual bank ${selectedBank?.name ?? selectedBank?.id}` });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error?.message ?? "Unable to delete virtual bank." });
    },
  });

  if (!isTenantAdmin && !isBorrower) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-3">
        <h2 className="text-lg font-light text-foreground">Virtual Banks</h2>
        <p className="text-sm text-muted-foreground">
          This section is available to paymaster and admin accounts only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isBorrower
        ? renderBanksTable({ showCreatedBy: false, emptyMessage: "No virtual bank is assigned to your account yet." })
        : renderBanksTable({ showCreatedBy: true, emptyMessage: "No virtual banks found." })}

      <Dialog
        open={isBankDialogOpen}
        onOpenChange={(open) => {
          setIsBankDialogOpen(open);
          if (!open && selectedBank) {
            setRenameName(selectedBank.name ?? "");
            setTopUpAmount("");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Selected Bank</DialogTitle>
            <DialogDescription>Manage the bank you selected from the table.</DialogDescription>
          </DialogHeader>

          {selectedBank ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/20">
                <p className="text-sm font-semibold text-foreground">{selectedBank.name}</p>
                <p className="text-xs text-muted-foreground">ID: {selectedBank.id}</p>
                <p className="text-xs text-muted-foreground">Balance: {shouldShowBalances ? selectedBank.balance ?? "-" : "••••••"}</p>
                <p className="text-xs text-muted-foreground">Created by: {selectedBank.createdBy ?? "-"}</p>
                <p className="text-xs text-muted-foreground">Created at: {formatDateTime(selectedBank.createdAt)}</p>
                <p className="text-xs text-muted-foreground">Date modified: {formatDateTime(selectedBank.updatedAt)}</p>
              </div>

              {canManageSelectedBank ? (
                <>
                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground">
                      {isSelectedBankOwner ? "Top-up amount" : "Add funds from your wallet"}
                    </label>
                    <input
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(formatNumberInput(e.target.value))}
                      placeholder="Top-up amount"
                      className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
                    />
                    <button
                      onClick={() => topUpMutation.mutate()}
                      disabled={topUpMutation.isPending || !canManageSelectedBank}
                      className="w-full px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {topUpMutation.isPending ? (
                        <>
                          <Spinner size="sm" />
                          Topping Up...
                        </>
                      ) : (
                        "Top Up"
                      )}
                    </button>
                  </div>

                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  This account is view-only. Only its owner or an administrator can add funds.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Select a bank from the table to see its balance and manage it if you own it.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this virtual bank? The balance will be refunded to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-6 py-2 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteMutation.mutate();
                setIsDeleteConfirmOpen(false);
              }}
              disabled={deleteMutation.isPending}
              className="px-6 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      
    </div>
  );
};

export default VirtualBanksPage;
