import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveLoan,
  createLoan,
  fetchLoanPackages,
  fetchLoans,
  LoanPeriod,
  LoanStatus,
  LoanSummary,
  rejectLoan,
} from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BorrowerPage = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [period, setPeriod] = useState<LoanPeriod>("THREE_MONTHS");

  const { data: pendingLoans, isLoading: isPendingLoading, isError: isPendingError } = useQuery<LoanSummary[]>({
    queryKey: ["loans", "PENDING"],
    queryFn: () => fetchLoans("PENDING" as LoanStatus),
  });

  const { data: approvedLoans, isLoading: isApprovedLoading, isError: isApprovedError } = useQuery<LoanSummary[]>({
    queryKey: ["loans", "APPROVED"],
    queryFn: () => fetchLoans("APPROVED" as LoanStatus),
  });

  const { data: allLoans, isLoading: isAllLoading, isError: isAllError } = useQuery<LoanSummary[]>({
    queryKey: ["loans", "ALL"],
    queryFn: () => fetchLoans(),
  });

  const { data: loanPackages } = useQuery({
    queryKey: ["loan-packages"],
    queryFn: fetchLoanPackages,
  });

  const availablePackages = useMemo(() => loanPackages ?? [], [loanPackages]);

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User not loaded yet.");
      if (!selectedPackageId || !principalAmount || !interestRate) {
        throw new Error("Loan package, amount, and interest are required.");
      }

      return createLoan({
        borrowerId: user.id,
        loanPackageId: Number(selectedPackageId),
        principalAmount: Number(principalAmount),
        interestRate: Number(interestRate),
        period,
      });
    },
    onSuccess: () => {
      setSelectedPackageId("");
      setPrincipalAmount("");
      setInterestRate("");
      setPeriod("THREE_MONTHS");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({ title: "Loan submitted", description: "Loan request has been created." });
    },
    onError: (error: any) => {
      toast({ title: "Loan creation failed", description: error?.message ?? "Unable to create loan." });
    },
  });
  return (
    <div className="space-y-6">
      {/* Top tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Loan Applications */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground">New Loan Applications</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-2 text-left w-8"></th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-center">Amount</th>
                <th className="px-4 py-2 text-center">Interest</th>
                <th className="px-4 py-2 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPendingLoading && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-muted-foreground text-center">
                    Loading pending applications...
                  </td>
                </tr>
              )}
              {!isPendingLoading && isPendingError && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-destructive text-center">
                    Unable to load pending applications.
                  </td>
                </tr>
              )}
              {(pendingLoans ?? []).map((loan, i) => (
                <tr key={loan.id} className="border-b border-border">
                  <td className="px-4 py-2">
                    <div className="w-4 h-4 rounded-sm bg-muted-foreground" />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{loan.borrowerName ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.amount ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.interest ?? "-"}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-approve text-approve-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => loan.id && approveMutation.mutate(loan.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            ✓
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Approve this loan</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => loan.id && rejectMutation.mutate(loan.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            ✕
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Decline this loan</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
              {!isPendingLoading && !isPendingError && (!pendingLoans || pendingLoans.length === 0) && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-muted-foreground text-center">
                    No pending loan applications.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Approved Applications */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground text-right">Approved Applications</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-2 text-left w-8"></th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-center">Amount</th>
                <th className="px-4 py-2 text-center">Interest</th>
              </tr>
            </thead>
            <tbody>
              {isApprovedLoading && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-muted-foreground text-center">
                    Loading approved applications...
                  </td>
                </tr>
              )}
              {!isApprovedLoading && isApprovedError && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-destructive text-center">
                    Unable to load approved applications.
                  </td>
                </tr>
              )}
              {(approvedLoans ?? []).map((loan, i) => (
                <tr key={loan.id} className="border-b border-border">
                  <td className="px-4 py-2">
                    <div className="w-4 h-4 rounded-sm bg-approve" />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{loan.borrowerName ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.amount ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.interest ?? "-"}</td>
                </tr>
              ))}
              {!isApprovedLoading && !isApprovedError && (!approvedLoans || approvedLoans.length === 0) && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-muted-foreground text-center">
                    No approved applications.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-muted-foreground">Loan Requests</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left">Name<br/>of Borrower</th>
              <th className="px-4 py-3 text-center">Amount (Gh¢)</th>
              <th className="px-4 py-3 text-center">Interest</th>
              <th className="px-4 py-3 text-center">Tenure</th>
              <th className="px-4 py-3 text-center">Installment</th>
              <th className="px-4 py-3 text-center">Bank</th>
              <th className="px-4 py-3 text-center">Bank<br/>Account</th>
            </tr>
          </thead>
          <tbody>
            {isAllLoading && (
              <tr className="border-b border-border">
                <td colSpan={7} className="px-4 py-3 text-muted-foreground text-center">
                  Loading dashboard loans...
                </td>
              </tr>
            )}
            {!isAllLoading && isAllError && (
              <tr className="border-b border-border">
                <td colSpan={7} className="px-4 py-3 text-destructive text-center">
                  Unable to load dashboard loans.
                </td>
              </tr>
            )}
            {(allLoans ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">{row.borrowerName ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.amount ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.tenure ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.installment ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.bank ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.accountName ?? "-"}</td>
              </tr>
            ))}
            {!isAllLoading && !isAllError && (!allLoans || allLoans.length === 0) && (
              <tr className="border-b border-border">
                <td colSpan={7} className="px-4 py-3 text-muted-foreground text-center">
                  No loans available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LOAN / Approve / Decline */}
      <div className="bg-card rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-muted-foreground text-lg tracking-widest">LOAN</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
          <select
            value={selectedPackageId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedPackageId(id);
              const selected = availablePackages.find((pkg) => String(pkg.id) === id);
              if (selected && selected.interestRate != null) {
                setInterestRate(String(selected.interestRate));
              } else {
                setInterestRate("");
              }
            }}
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="">Select Package</option>
            {availablePackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                #{pkg.id} - {pkg.virtualBank?.name ?? "Loan Package"}
              </option>
            ))}
          </select>
          <input
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            placeholder="Principal Amount"
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            value={interestRate}
            readOnly
            disabled
            placeholder="Interest Rate (from package)"
            className="px-4 py-2 rounded-full border border-primary/40 bg-muted text-foreground"
          />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as LoanPeriod)}
            className="px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="THREE_MONTHS">3 Months</option>
            <option value="SIX_MONTHS">6 Months</option>
            <option value="ONE_YEAR">1 Year</option>
          </select>
        </div>
        <div className="flex items-center justify-center gap-12">
          <button
            className="px-10 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => createLoanMutation.mutate()}
            disabled={createLoanMutation.isPending}
          >
            {createLoanMutation.isPending ? "Submitting..." : "Request Loan"}
          </button>
          <button
            className="px-10 py-2 rounded-full bg-approve text-approve-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => {
              if (pendingLoans && pendingLoans.length > 0) {
                approveMutation.mutate(pendingLoans[0].id);
              }
            }}
          >
            Approve
          </button>
          <button
            className="px-10 py-2 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => {
              if (pendingLoans && pendingLoans.length > 0) {
                rejectMutation.mutate(pendingLoans[0].id);
              }
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowerPage;
