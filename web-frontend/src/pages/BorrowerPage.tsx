import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLoan,
  fetchBorrowerLoans,
  fetchLoanPackages,
  LoanPeriod,
  LoanSummary,
} from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { getAuth } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";
import { formatNumberInput, parseAmount } from "@/lib/format-number";
import { getRoleAccess } from "@/lib/access";

const BorrowerPage = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const access = getRoleAccess(user?.role);

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [period, setPeriod] = useState<LoanPeriod>("THREE_MONTHS");

  const {
    data: borrowerLoans,
    isLoading: isBorrowerLoansLoading,
    isError: isBorrowerLoansError,
    error: borrowerLoansError,
  } = useQuery<LoanSummary[]>({
    queryKey: ["borrower-loans", user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("User not loaded yet.");
      }
      return fetchBorrowerLoans(user.id);
    },
    enabled: !!user?.id && access.canBorrow,
  });

  const allLoans = useMemo(() => borrowerLoans ?? [], [borrowerLoans]);
  const outstandingRepayments = useMemo(
    () => allLoans.filter((loan) => loan.status === "APPROVED"),
    [allLoans]
  );

  const { data: loanPackages } = useQuery({
    queryKey: ["loan-packages"],
    queryFn: fetchLoanPackages,
  });

  const availablePackages = useMemo(() => loanPackages ?? [], [loanPackages]);

  const createLoanMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User not loaded yet.");
      if (!selectedPackageId || !principalAmount || !interestRate) {
        throw new Error("Loan package, amount, and interest are required.");
      }

      const principal = Number(parseAmount(principalAmount));
      const selected = availablePackages.find((pkg) => String(pkg.id) === selectedPackageId);

      if (!Number.isFinite(principal) || principal <= 0) {
        throw new Error("Please enter a valid amount greater than zero.");
      }

      if (selected && Number.isFinite(Number(selected.balance)) && principal > Number(selected.balance)) {
        throw new Error("Requested amount exceeds package balance. Please enter a lower amount.");
      }

      return createLoan({
        borrowerId: user.id,
        loanPackageId: Number(selectedPackageId),
        principalAmount: principal,
        interestRate: Number(interestRate),
        period,
      });
    },
    onSuccess: () => {
      const auth = getAuth();
      setSelectedPackageId("");
      setPrincipalAmount("");
      setInterestRate("");
      setPeriod("THREE_MONTHS");
      queryClient.invalidateQueries({ queryKey: ["borrower-loans"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({ title: "Loan Request Submitted", description: "Loan request has been created." });
      pushNotification(queryClient, auth?.userId, {
        type: 'loan-request',
        message: `Requested loan of Gh¢ ${Number(parseAmount(principalAmount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} at ${interestRate}% interest`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Loan creation failed", description: error?.message ?? "Unable to create loan." });
    },
  });

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return "Not set";
    const date = new Date(dueDate);
    if (Number.isNaN(date.getTime())) return dueDate;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "Gh¢ -";

    return `Gh¢ ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getDueBadge = (dueDate?: string) => {
    if (!dueDate) return { label: "Date pending", className: "bg-muted text-muted-foreground" };

    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      return { label: "Date pending", className: "bg-muted text-muted-foreground" };
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffInDays = Math.ceil((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return { label: "Overdue", className: "bg-destructive/15 text-destructive" };
    }

    if (diffInDays <= 7) {
      return { label: `Due in ${diffInDays} day${diffInDays === 1 ? "" : "s"}`, className: "bg-amber-100 text-amber-700" };
    }

    return { label: "Upcoming", className: "bg-approve/15 text-approve" };
  };

  if (!access.canBorrow) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold text-foreground">Borrowing is not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">Administrators can manage lending operations and review loans, but cannot submit personal borrowing requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Loan */}
      <div className="bg-card rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-muted-foreground text-lg tracking-widest">REQUEST A LOAN</p>
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
                {pkg.name ?? `Package #${pkg.id}`} - {formatCurrency(pkg.balance)}
              </option>
            ))}
          </select>
          <input
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(formatNumberInput(e.target.value))}
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
        <div className="flex items-center justify-center">
          <button
            className="px-10 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={() => createLoanMutation.mutate()}
            disabled={createLoanMutation.isPending}
          >
            {createLoanMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Submitting...
              </>
            ) : (
              "Request Loan"
            )}
          </button>
        </div>
      </div>
      
      {/* Applications */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-muted-foreground">My Loan Applications</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left">Principal (Gh¢)</th>
              <th className="px-4 py-3 text-center">Interest</th>
              <th className="px-4 py-3 text-center">Tenure</th>
              <th className="px-4 py-3 text-center">Loan Package</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isBorrowerLoansLoading && (
              <tr className="border-b border-border">
                <td colSpan={5} className="px-4 py-3 text-muted-foreground text-center">
                  Loading your applications...
                </td>
              </tr>
            )}
            {!isBorrowerLoansLoading && isBorrowerLoansError && (
              <tr className="border-b border-border">
                <td colSpan={5} className="px-4 py-3 text-destructive text-center">
                  {(borrowerLoansError as Error | undefined)?.message ?? "Unable to load your applications."}
                </td>
              </tr>
            )}
            {allLoans.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-3 text-left text-muted-foreground">{formatCurrency(row.amount)}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.tenure ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.loanPackage ?? row.virtualBank ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.status ?? "-"}</td>
              </tr>
            ))}
            {!isBorrowerLoansLoading && !isBorrowerLoansError && allLoans.length === 0 && (
              <tr className="border-b border-border">
                <td colSpan={5} className="px-4 py-3 text-muted-foreground text-center">
                  No loan applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {outstandingRepayments.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2 border-b border-border">
            <h2 className="text-lg font-light text-muted-foreground">Upcoming Repayments</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left">Principal (Gh¢)</th>
                  <th className="px-4 py-3 text-center">Repayment (Gh¢)</th>
                  <th className="px-4 py-3 text-center">Due Date</th>
                  <th className="px-4 py-3 text-center">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {outstandingRepayments.map((loan) => {
                  const dueBadge = getDueBadge(loan.dueDate);
                  return (
                    <tr key={loan.id} className="border-b border-border">
                      <td className="px-4 py-3 text-muted-foreground">{formatCurrency(loan.amount)}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{loan.repaymentAmount ?? "-"}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{formatDueDate(loan.dueDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${dueBadge.className}`}>
                          {dueBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </table>
        </div>
      )}

      
    </div>
  );
};

export default BorrowerPage;
