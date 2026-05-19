import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVirtualBank,
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

const VirtualBanksPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const isTenantAdmin = user?.role === "PAYMASTER" || user?.role === "ADMIN";

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
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

  const selectedBank = (banks ?? []).find((bank) => String(bank.id) === selectedBankId);
  const canManageSelectedBank = !!selectedBank && (isTenantAdmin || selectedBank.createdById === user?.id);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name) throw new Error("Virtual bank name is required.");

      return createVirtualBank({
        name,
        balance: balance ? Number(balance) : undefined,
      });
    },
    onSuccess: () => {
      setName("");
      setBalance("");
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      queryClient.invalidateQueries({ queryKey: ["current-user", user?.id] });
      toast({ title: "Virtual bank created" });
      pushNotification(queryClient, user?.id, {
        type: 'bank-create',
        message: `Created virtual bank ${name} with Gh¢ ${Number(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Create failed", description: error?.message ?? "Unable to create virtual bank." });
    },
  });

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
      const amount = Number(topUpAmount);
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

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-light text-foreground">Create Virtual Bank</h2>
          {/* <p className="text-xs text-muted-foreground mt-1">Create a new bank without leaving the page.</p> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Virtual bank name"
            className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Initial deposit"
            className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          />
        </div>
        <div className="flex items-center justify-center gap-12">
          <button onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-50 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {createMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Creating...
              </>
            ) : (
              "Create Virtual Bank"
            )}
          </button>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-foreground">Virtual Banks</h2>
          <p className="text-xs text-muted-foreground mt-1">Click a bank to manage it.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-2 text-left font-normal">Name</th>
              <th className="px-4 py-2 text-center font-normal">Balance</th>
              <th className="px-4 py-2 text-center font-normal">Created By</th>
            </tr>
          </thead>
          <tbody>
            {isBanksLoading && (
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-muted-foreground" colSpan={4}>
                  Loading virtual banks...
                </td>
              </tr>
            )}

            {!isBanksLoading && isBanksError && (
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-destructive text-center" colSpan={4}>
                  {(banksError as Error)?.message ?? "Unable to load virtual banks."}
                </td>
              </tr>
            )}

            {!isBanksLoading && !isBanksError &&
              (banks ?? []).map((bank) => (
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
                  <td className="px-4 py-2 text-center text-muted-foreground">{bank.balance ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{bank.createdBy ?? "-"}</td>
                </tr>
              ))}

            {!isBanksLoading && !isBanksError && (banks ?? []).length === 0 && (
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-muted-foreground text-center" colSpan={4}>
                  No virtual banks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                <p className="text-xs text-muted-foreground">Balance: {selectedBank.balance ?? "-"}</p>
                <p className="text-xs text-muted-foreground">Created by: {selectedBank.createdBy ?? "-"}</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Rename bank</label>
                <input
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="Rename bank"
                  className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
                />
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !canManageSelectedBank}
                  className="w-full px-6 py-2 rounded-full bg-approve text-approve-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Renaming...
                    </>
                  ) : (
                    "Rename"
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Top-up amount</label>
                <input
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
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

              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={!canManageSelectedBank}
                className="w-full px-6 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Select a bank from the table to rename, top up, or delete it.
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
