import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLoanPackage,
  deleteLoanPackage,
  fetchLoanPackageById,
  fetchLoanPackages,
  fetchVirtualBanks,
  LoanPackage,
  updateLoanPackage,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";
import { pushNotification } from "@/lib/notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LenderPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const auth = getAuth();

  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [virtualBankId, setVirtualBankId] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { data: loanPackages, isLoading: isLoanPackagesLoading, isError: isLoanPackagesError } = useQuery<LoanPackage[]>({
    queryKey: ["loan-packages"],
    queryFn: fetchLoanPackages,
  });

  const { data: selectedLoanPackage } = useQuery({
    queryKey: ["loan-packages", selectedId],
    queryFn: () => fetchLoanPackageById(Number(selectedId)),
    enabled: !!selectedId,
  });

  const { data: virtualBanks, isLoading: isVirtualBanksLoading } = useQuery({
    queryKey: ["virtual-banks"],
    queryFn: fetchVirtualBanks,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) {
        throw new Error("Package name is required.");
      }

      const packageBalance = Number(balance);
      const selectedBank = (virtualBanks ?? []).find((bank) => String(bank.id) === virtualBankId);

      if (!Number.isFinite(packageBalance) || packageBalance <= 0) {
        throw new Error("Please enter a valid balance amount greater than zero.");
      }

      if (selectedBank && Number.isFinite(Number(selectedBank.balance)) && packageBalance > Number(selectedBank.balance)) {
        throw new Error("Loan package balance cannot exceed virtual bank balance. Available: " + selectedBank.balance);
      }

      return createLoanPackage({
        name: name.trim(),
        virtualBankId: Number(virtualBankId),
        balance: Number(balance),
        interestRate: Number(interestRate),
      });
    },
    onSuccess: () => {
      setName("");
      setVirtualBankId("");
      setBalance("");
      setInterestRate("");
      queryClient.invalidateQueries({ queryKey: ["loan-packages"] });
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      queryClient.invalidateQueries({ queryKey: ["current-user", auth?.userId] });
      toast({ title: "Loan package created" });
      pushNotification(queryClient, auth?.userId, {
        type: 'loan-create',
        message: `Created loan package on VB #${virtualBankId} for Gh¢ ${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    },
    onError: (error: any) => toast({ title: "Create failed", description: error?.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedLoanPackage) {
        throw new Error("Select a loan package to top up.");
      }

      if (!name.trim()) {
        throw new Error("Package name is required.");
      }

      const topup = Number(topupAmount);
      const currentBalance = Number(selectedLoanPackage.balance ?? 0);
      const newBalance = currentBalance + topup;
      const selectedBank = (virtualBanks ?? []).find((bank) => String(bank.id) === virtualBankId);

      if (!Number.isFinite(topup) || topup <= 0) {
        throw new Error("Please enter a valid topup amount greater than zero.");
      }

      if (selectedBank && Number.isFinite(Number(selectedBank.balance)) && topup > Number(selectedBank.balance)) {
        throw new Error("Top up amount exceeds virtual bank balance. Available balance: " + (selectedBank.balance));
      }

      return updateLoanPackage(Number(selectedId), {
        name: name.trim(),
        virtualBankId: Number(virtualBankId),
        balance: newBalance,
        interestRate: Number(interestRate),
      });
    },
    onSuccess: () => {
      setTopupAmount("");
      setIsPackageDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["loan-packages"] });
      queryClient.invalidateQueries({ queryKey: ["loan-packages", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      queryClient.invalidateQueries({ queryKey: ["current-user", auth?.userId] });
      toast({ title: "Loan package topped up" });
      pushNotification(queryClient, auth?.userId, { type: 'loan-update', message: `Topped up loan package #${selectedId}` });
    },
    onError: (error: any) => toast({ title: "Update failed", description: error?.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLoanPackage(Number(selectedId)),
    onSuccess: () => {
      setSelectedId("");
      setIsPackageDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["loan-packages"] });
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      queryClient.invalidateQueries({ queryKey: ["current-user", auth?.userId] });
      toast({ title: "Loan package deleted" });
      pushNotification(queryClient, auth?.userId, { type: 'loan-delete', message: `Deleted loan package #${selectedId}` });
    },
    onError: (error: any) => toast({ title: "Delete failed", description: error?.message }),
  });

  const lenderData = (loanPackages ?? [])
    .filter((pkg) => {
      const role = auth?.role;
      // Admins and paymasters should see all packages. Borrowers should also see packages
      // so they can request loans. Otherwise show packages created by the current user.
      if (!role) return false;
      if (role === "PAYMASTER" || role === "ADMIN" || role === "BORROWER") return true;
      return pkg.virtualBank?.createdById === auth?.userId;
    })
    .map((pkg) => ({
      id: pkg.id,
      loanPackage: pkg.name ?? `Package #${pkg.id}`,
      lending: pkg.balance,
      interest: `${pkg.interestRate}%`,
    }));

  useEffect(() => {
    if (!selectedLoanPackage) return;

    setName(selectedLoanPackage.name ?? "");
    setVirtualBankId(String(selectedLoanPackage.virtualBank?.id ?? ""));
    setInterestRate(String(selectedLoanPackage.interestRate ?? ""));
    setTopupAmount("");
  }, [selectedLoanPackage]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-muted-foreground text-lg tracking-widest">CREATE LOAN PACKAGE</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
          <select
            value={virtualBankId}
            onChange={(e) => setVirtualBankId(e.target.value)}
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="">Virtual Bank</option>
            {isVirtualBanksLoading && <option value="">Loading virtual banks...</option>}
            {(virtualBanks ?? [])
              .filter((bank) => bank.createdById === auth?.userId)
              .map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Package Name"
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Balance"
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="Interest Rate"
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          />
        </div>
        <div className="flex items-center justify-center gap-12">
          <button
            className="px-10 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-muted-foreground">Loan Packages</h2>
          <p className="text-xs text-muted-foreground mt-1">Click a loan package to edit it.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left">Loan Package</th>
              <th className="px-4 py-3 text-center">Lending (Gh¢)</th>
              <th className="px-4 py-3 text-center">Interest</th>
            </tr>
          </thead>
          <tbody>
            {isLoanPackagesLoading && (
              <tr className="border-b border-border">
                <td colSpan={3} className="px-4 py-3 text-center text-muted-foreground">
                  Loading loan packages...
                </td>
              </tr>
            )}
            {!isLoanPackagesLoading && isLoanPackagesError && (
              <tr className="border-b border-border">
                <td colSpan={3} className="px-4 py-3 text-center text-destructive">
                  Unable to load loan packages.
                </td>
              </tr>
            )}
            {lenderData.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/30 ${String(row.id) === selectedId ? "bg-muted/40" : ""}`}
                onClick={() => {
                  setSelectedId(String(row.id));
                  setIsPackageDialogOpen(true);
                }}
              >
                <td className="px-4 py-3 text-muted-foreground">{row.loanPackage}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.lending}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest}</td>
              </tr>
            ))}
            {!isLoanPackagesLoading && !isLoanPackagesError && lenderData.length === 0 && (
              <tr className="border-b border-border">
                <td colSpan={3} className="px-4 py-3 text-center text-muted-foreground">
                  No loan packages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={isPackageDialogOpen}
        onOpenChange={(open) => {
          setIsPackageDialogOpen(open);
          if (!open && selectedLoanPackage) {
            setName(selectedLoanPackage.name ?? "");
            setVirtualBankId(String(selectedLoanPackage.virtualBank?.id ?? ""));
            setTopupAmount("");
            setInterestRate(String(selectedLoanPackage.interestRate ?? ""));
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Selected Package</DialogTitle>
            <DialogDescription>Update or remove the package you selected from the table.</DialogDescription>
          </DialogHeader>

          {selectedId ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/20">
                <p className="text-sm font-semibold text-foreground">{selectedLoanPackage?.name ?? `Loan package #${selectedId}`}</p>
                <p className="text-xs text-muted-foreground">
                  Virtual bank: {selectedLoanPackage?.virtualBank?.name ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">Current balance: {selectedLoanPackage?.balance ?? "-"}</p>
                <p className="text-xs text-muted-foreground">Interest: {selectedLoanPackage?.interestRate ?? "-"}%</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Package name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Package name"
                    className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Virtual bank</label>
                  <select
                    value={virtualBankId}
                    onChange={(e) => setVirtualBankId(e.target.value)}
                    className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
                  >
                    <option value="">Virtual Bank</option>
                    {isVirtualBanksLoading && <option value="">Loading virtual banks...</option>}
                    {(virtualBanks ?? [])
                      .filter((bank) => bank.createdById === auth?.userId)
                      .map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Topup Amount</label>
                  <input
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Amount to add"
                    className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                  &nbsp; Current balance: Gh¢ {selectedLoanPackage?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Interest rate</label>
                  <input
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="Interest Rate"
                    className="w-full px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="px-10 py-2 rounded-full bg-approve text-approve-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !selectedId}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
                <button
                  className="px-10 py-2 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={!selectedId}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Select a loan package from the table to edit or delete it.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this loan package? The balance will be refunded to the virtual bank.
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

export default LenderPage;
