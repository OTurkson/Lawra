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

const BorrowerPage = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { toast } = useToast();

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
    enabled: !!user?.id,
  });

  const pendingLoans = useMemo(
    () => (borrowerLoans ?? []).filter((loan) => loan.status === "PENDING"),
    [borrowerLoans]
  );
  const approvedLoans = useMemo(
    () => (borrowerLoans ?? []).filter((loan) => loan.status === "APPROVED"),
    [borrowerLoans]
  );
  const allLoans = borrowerLoans ?? [];

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
      queryClient.invalidateQueries({ queryKey: ["borrower-loans"] });
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
            <h2 className="text-lg font-light text-foreground">Your Loan Applications</h2>
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
              {isBorrowerLoansLoading && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-muted-foreground text-center">
                    Loading pending applications...
                  </td>
                </tr>
              )}
              {!isBorrowerLoansLoading && isBorrowerLoansError && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-destructive text-center">
                    {(borrowerLoansError as Error | undefined)?.message ?? "Unable to load pending applications."}
                  </td>
                </tr>
              )}
              {pendingLoans.map((loan) => (
                <tr key={loan.id} className="border-b border-border">
                  <td className="px-4 py-2">
                    <div className="w-4 h-4 rounded-sm bg-muted-foreground" />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{loan.borrowerName ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.amount ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.interest ?? "-"}</td>
                </tr>
              ))}
              {!isBorrowerLoansLoading && !isBorrowerLoansError && pendingLoans.length === 0 && (
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
              {isBorrowerLoansLoading && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-muted-foreground text-center">
                    Loading approved applications...
                  </td>
                </tr>
              )}
              {!isBorrowerLoansLoading && isBorrowerLoansError && (
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-4 py-2 text-destructive text-center">
                    {(borrowerLoansError as Error | undefined)?.message ?? "Unable to load approved applications."}
                  </td>
                </tr>
              )}
              {approvedLoans.map((loan) => (
                <tr key={loan.id} className="border-b border-border">
                  <td className="px-4 py-2">
                    <div className="w-4 h-4 rounded-sm bg-approve" />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{loan.borrowerName ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.amount ?? "-"}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.interest ?? "-"}</td>
                </tr>
              ))}
              {!isBorrowerLoansLoading && !isBorrowerLoansError && approvedLoans.length === 0 && (
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
              <th className="px-4 py-3 text-center">Bank</th>
            </tr>
          </thead>
          <tbody>
            {isBorrowerLoansLoading && (
              <tr className="border-b border-border">
                <td colSpan={5} className="px-4 py-3 text-muted-foreground text-center">
                  Loading dashboard loans...
                </td>
              </tr>
            )}
            {!isBorrowerLoansLoading && isBorrowerLoansError && (
              <tr className="border-b border-border">
                <td colSpan={5} className="px-4 py-3 text-destructive text-center">
                  {(borrowerLoansError as Error | undefined)?.message ?? "Unable to load dashboard loans."}
                </td>
              </tr>
            )}
            {allLoans.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">{row.borrowerName ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.amount ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.tenure ?? "-"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.bank ?? "-"}</td>
              </tr>
            ))}
            {!isBorrowerLoansLoading && !isBorrowerLoansError && allLoans.length === 0 && (
              <tr className="border-b border-border">
                <td colSpan={5} className="px-4 py-3 text-muted-foreground text-center">
                  No loans available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Request Loan */}
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
        <div className="flex items-center justify-center">
          <button
            className="px-10 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => createLoanMutation.mutate()}
            disabled={createLoanMutation.isPending}
          >
            {createLoanMutation.isPending ? "Submitting..." : "Request Loan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowerPage;
