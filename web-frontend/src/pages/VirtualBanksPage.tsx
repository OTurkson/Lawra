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
  const canManageSelectedBank = !!selectedBank && (
    isTenantAdmin || selectedBank.createdById === user?.id
  );

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
      toast({ title: "Virtual bank created" });
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
      setRenameName("");
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      toast({ title: "Virtual bank updated" });
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
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      toast({ title: "Top-up successful" });
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
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      toast({ title: "Virtual bank deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error?.message ?? "Unable to delete virtual bank." });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Banks List */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground">Virtual Banks</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">ID</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-normal">Name</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Balance</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Created By</th>
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

              {!isBanksLoading && !isBanksError && (banks ?? []).map((bank) => (
                  <tr
                    key={bank.id}
                    className={`border-b border-border cursor-pointer ${String(bank.id) === selectedBankId ? "bg-muted/40" : ""}`}
                    onClick={() => {
                      setSelectedBankId(String(bank.id));
                      setRenameName(bank.name ?? "");
                    }}
                  >
                    <td className="px-4 py-2 text-center text-muted-foreground">{bank.id}</td>
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

        {/* Manage Virtual Banks */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground">Manage Virtual Banks</h2>
          </div>

          <div className="px-4 pb-4 space-y-3 border-b border-border">
            <p className="text-sm text-muted-foreground">Create Virtual Bank</p>
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
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {createMutation.isPending ? "Creating..." : "Create Virtual Bank"}
            </button>
          </div>

          <div className="px-4 py-4 space-y-3">
            <p className="text-sm text-muted-foreground">Selected Bank Actions</p>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                const bank = (banks ?? []).find((item) => String(item.id) === e.target.value);
                setRenameName(bank?.name ?? "");
              }}
              className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
            >
              <option value="">Select virtual bank</option>
              {(banks ?? []).map((bank) => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>

            <input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Rename bank"
              className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
            />
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !selectedBankId || !canManageSelectedBank}
              className="w-full px-6 py-2 rounded-full bg-approve text-approve-foreground text-sm font-semibold disabled:opacity-60"
            >
              Rename
            </button>

            <input
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Top-up amount"
              className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
            />
            <button
              onClick={() => topUpMutation.mutate()}
              disabled={topUpMutation.isPending || !selectedBankId || !canManageSelectedBank}
              className="w-full px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
            >
              Top Up
            </button>

            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending || !selectedBankId || !canManageSelectedBank}
              className="w-full px-6 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60"
            >
              Delete
            </button>

            {selectedBank && !canManageSelectedBank && !isTenantAdmin && (
              <p className="text-xs text-muted-foreground">
                You can only manage virtual banks created by you.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualBanksPage;
