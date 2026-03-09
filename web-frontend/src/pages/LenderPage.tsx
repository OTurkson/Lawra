import { useState } from "react";
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

const LenderPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState("");
  const [virtualBankId, setVirtualBankId] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");

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
    mutationFn: () =>
      createLoanPackage({
        virtualBankId: Number(virtualBankId),
        balance: Number(balance),
        interestRate: Number(interestRate),
      }),
    onSuccess: () => {
      setVirtualBankId("");
      setBalance("");
      setInterestRate("");
      queryClient.invalidateQueries({ queryKey: ["loan-packages"] });
      toast({ title: "Loan package created" });
    },
    onError: (error: any) => toast({ title: "Create failed", description: error?.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateLoanPackage(Number(selectedId), {
        virtualBankId: Number(virtualBankId),
        balance: Number(balance),
        interestRate: Number(interestRate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-packages"] });
      toast({ title: "Loan package updated" });
    },
    onError: (error: any) => toast({ title: "Update failed", description: error?.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLoanPackage(Number(selectedId)),
    onSuccess: () => {
      setSelectedId("");
      queryClient.invalidateQueries({ queryKey: ["loan-packages"] });
      toast({ title: "Loan package deleted" });
    },
    onError: (error: any) => toast({ title: "Delete failed", description: error?.message }),
  });

  const lenderData = (loanPackages ?? []).map((pkg) => ({
    id: pkg.id,
    fund: pkg.virtualBank?.name ?? "-",
    lending: pkg.balance,
    interest: `${pkg.interestRate}%`,
    tenure: "-",
    installment: "-",
    lenders: "-",
  }));

  return (
    <div className="space-y-6">
      {/* Main Dashboard */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-muted-foreground">Main Dashboard</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left">Name of Fund</th>
              <th className="px-4 py-3 text-center">Lending (Gh¢)</th>
              <th className="px-4 py-3 text-center">Interest</th>
              <th className="px-4 py-3 text-center">Tenur</th>
              <th className="px-4 py-3 text-center">Installment</th>
              <th className="px-4 py-3 text-center">Number of Lenders</th>
            </tr>
          </thead>
          <tbody>
            {isLoanPackagesLoading && (
              <tr className="border-b border-border">
                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">
                  Loading loan packages...
                </td>
              </tr>
            )}
            {!isLoanPackagesLoading && isLoanPackagesError && (
              <tr className="border-b border-border">
                <td colSpan={6} className="px-4 py-3 text-center text-destructive">
                  Unable to load loan packages.
                </td>
              </tr>
            )}
            {lenderData.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">{row.fund}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.lending}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.tenure}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.installment}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.lenders}</td>
              </tr>
            ))}
            {!isLoanPackagesLoading && !isLoanPackagesError && lenderData.length === 0 && (
              <tr className="border-b border-border">
                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">
                  No loan packages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FUNDS / Approve / Decline */}
      <div className="bg-card rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-muted-foreground text-lg tracking-widest">FUNDS</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
          <select
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              const selected = (loanPackages ?? []).find((pkg) => String(pkg.id) === id);
              if (selected) {
                setVirtualBankId(String(selected.virtualBank?.id ?? ""));
                setBalance(String(selected.balance ?? ""));
                setInterestRate(String(selected.interestRate ?? ""));
              }
            }}
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="">Loan Package ID</option>
            {(loanPackages ?? []).map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.id}
              </option>
            ))}
          </select>
          {selectedLoanPackage && (
            <span className="text-xs text-muted-foreground px-2 py-2">Selected package #{selectedLoanPackage.id}</span>
          )}
          <select
            value={virtualBankId}
            onChange={(e) => setVirtualBankId(e.target.value)}
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="">Virtual Bank</option>
            {isVirtualBanksLoading && <option value="">Loading virtual banks...</option>}
            {(virtualBanks ?? []).map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
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
            className="px-10 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            Create
          </button>
          <button
            className="px-10 py-2 rounded-full bg-approve text-approve-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !selectedId}
          >
            Update
          </button>
          <button
            className="px-10 py-2 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending || !selectedId}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default LenderPage;
