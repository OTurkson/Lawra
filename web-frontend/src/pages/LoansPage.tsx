import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBorrowerLoans, fetchLoans, fetchRepayments, LoanSummary, LoanStatus, RepaymentSummary, repayLoan, updateLoanStatus } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import TablePaginator from "@/components/ui/TablePaginator";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { getAuth, normalizeRole } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LoansPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role);
  const isManagement = role === "ADMIN" || role === "PAYMASTER";
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<number, string>>({});
  const [pendingRepayment, setPendingRepayment] = useState<{ loan: LoanSummary; amount: number } | null>(null);
  const [historyLoan, setHistoryLoan] = useState<LoanSummary | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{
    id: number;
    status: "APPROVED" | "REJECTED";
    borrowerName?: string;
  } | null>(null);

  const {
    data: personalLoans,
    isLoading: isPersonalLoading,
    isError: isPersonalError,
    error: personalError,
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

  const {
    data: tenantLoans,
    isLoading: isTenantLoading,
    isError: isTenantError,
    error: tenantError,
  } = useQuery<LoanSummary[]>({
    queryKey: ["paymaster-loans", user?.id],
    queryFn: () => fetchLoans(),
    enabled: !!user?.id && isManagement,
  });

  const employeeLoans = useMemo(() => {
    if (!isManagement) return [];
    return (tenantLoans ?? []).filter((loan) => loan.borrowerId && loan.borrowerId !== user?.id);
  }, [isManagement, tenantLoans, user?.id]);

  const outstandingRepayments = useMemo(() => {
    const loans = isManagement ? tenantLoans ?? [] : personalLoans ?? [];
    return loans.filter(
      (loan) => loan.status === "APPROVED" && Number(loan.outstandingAmount ?? 0) > 0
    );
  }, [isManagement, personalLoans, tenantLoans]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LoanStatus }) => updateLoanStatus(id, { loanStatus: status }),
    onSuccess: (_data, { id, status }) => {
      const auth = getAuth();
      queryClient.invalidateQueries({ queryKey: ["paymaster-loans"] });
      queryClient.invalidateQueries({ queryKey: ["borrower-loans"] });
      toast({ title: "Loan updated", description: "Loan status has been updated." });
      
      // Push notification for approval/rejection
      const loanDetails = employeeLoans.find((l) => l.id === id);
      if (loanDetails && (status === "APPROVED" || status === "REJECTED")) {
        pushNotification(queryClient, auth?.userId, {
          type: 'loan-decision',
          message: `${status === "APPROVED" ? "Approved" : "Rejected"} loan of Gh¢ ${Number(loanDetails.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${loanDetails.borrowerName || "employee"}`,
        });
      }
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error?.message ?? "Could not update loan status." });
    },
  });

  const repaymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => repayLoan(id, amount),
    onSuccess: () => {
      setRepaymentAmounts({});
      queryClient.invalidateQueries({ queryKey: ["paymaster-loans"] });
      queryClient.invalidateQueries({ queryKey: ["borrower-loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan-repayments"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({ title: "Repayment successful" });
    },
    onError: (error: any) => {
      toast({ title: "Repayment failed", description: error?.message ?? "Could not process repayment." });
    },
  });

  const repaymentHistoryQuery = useQuery<RepaymentSummary[]>({
    queryKey: ["loan-repayments", historyLoan?.id],
    queryFn: () => fetchRepayments(historyLoan!.id),
    enabled: !!historyLoan,
  });

  const renderOutstandingRepayments = () => {
    const isLoading = isManagement ? isTenantLoading : isPersonalLoading;
    const isError = isManagement ? isTenantError : isPersonalError;
    const error = isManagement ? tenantError : personalError;

    return (
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-foreground">Outstanding Repayments</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isManagement ? "Your outstanding repayments and those of other employees." : "Your accepted loans with an outstanding balance."}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                {isManagement && <th className="px-3 py-3 text-left">Borrower</th>}
                <th className="px-3 py-3 text-center">Loan</th>
                <th className="px-3 py-3 text-center">Total Repayment</th>
                <th className="px-3 py-3 text-center">Paid</th>
                <th className="px-3 py-3 text-center">Outstanding</th>
                <th className="px-3 py-3 text-center">Payment Status</th>
                <th className="px-3 py-3 text-center">Due Date</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={isManagement ? 8 : 7} className="px-3 py-3 text-center text-muted-foreground">Loading repayments...</td></tr>}
              {!isLoading && isError && <tr><td colSpan={isManagement ? 8 : 7} className="px-3 py-3 text-center text-destructive">{(error as Error)?.message ?? "Unable to load repayments."}</td></tr>}
              {!isLoading && !isError && outstandingRepayments.map((loan) => {
                const isOwnLoan = loan.borrowerId === user?.id;
                const canPay = isOwnLoan || isManagement;
                const amount = repaymentAmounts[loan.id] ?? "";
                return (
                  <tr key={loan.id} className="border-b border-border">
                    {isManagement && <td className="px-3 py-3 text-muted-foreground">{loan.borrowerName ?? "-"}</td>}
                    <td className="px-3 py-3 text-center text-muted-foreground">#{loan.id}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{loan.repaymentAmount ?? "-"}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{loan.totalPaid ?? 0}</td>
                    <td className="px-3 py-3 text-center font-medium text-foreground">{loan.outstandingAmount ?? "-"}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{loan.repaymentStatus?.replace("_", " ") ?? "PENDING"}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{loan.dueDate ?? "-"}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex min-w-52 flex-wrap items-center justify-center gap-2">
                        {canPay && <>
                          <input
                            value={amount}
                            onChange={(event) => setRepaymentAmounts((current) => ({ ...current, [loan.id]: event.target.value }))}
                            inputMode="decimal"
                            placeholder="Amount"
                            className="w-24 rounded border border-input bg-background px-2 py-1"
                          />
                          <button
                            onClick={() => {
                              const payment = Number(amount);
                              if (!Number.isFinite(payment) || payment <= 0) {
                                toast({ title: "Invalid amount", description: "Enter a repayment amount greater than zero." });
                                return;
                              }
                              if (payment > Number(loan.outstandingAmount ?? 0)) {
                                toast({ title: "Invalid amount", description: "The payment cannot exceed the outstanding balance." });
                                return;
                              }
                              setPendingRepayment({ loan, amount: payment });
                            }}
                            disabled={repaymentMutation.isPending || !amount}
                            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                          >
                            {isOwnLoan ? "Pay" : "Pay on behalf"}
                          </button>
                        </>}
                        <button
                          onClick={() => setHistoryLoan(loan)}
                          className="rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && outstandingRepayments.length === 0 && <tr><td colSpan={isManagement ? 8 : 7} className="px-3 py-3 text-center text-muted-foreground">No outstanding repayments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLoanTable = (
    rows: LoanSummary[],
    isLoading: boolean,
    isError: boolean,
    error: unknown,
    emptyMessage: string,
    allowActions = true,
    showInternalFields = false
  , paginate = false) => {
    const renderTable = (pageRows: LoanSummary[]) => (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-3 py-3 text-left">Borrower</th>
              <th className="px-3 py-3 text-center">Loan Amount</th>
              <th className="px-3 py-3 text-center">Interest Rate</th>
              <th className="px-3 py-3 text-center">Tenure</th>
              <th className="px-3 py-3 text-center">Repayment Amount</th>
              {showInternalFields && <th className="px-3 py-3 text-center">Bank</th>}
              {showInternalFields && <th className="px-3 py-3 text-center">Changed By</th>}
              <th className="px-3 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-b border-border">
                <td colSpan={showInternalFields ? 8 : 6} className="px-3 py-3 text-center text-muted-foreground">
                  Loading loans...
                </td>
              </tr>
            )}

            {!isLoading && isError && (
              <tr className="border-b border-border">
                <td colSpan={showInternalFields ? 8 : 6} className="px-3 py-3 text-center text-destructive">
                  {(error as Error)?.message ?? "Unable to load loans."}
                </td>
              </tr>
            )}

            {!isLoading && !isError && pageRows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-3 py-3 text-muted-foreground">{row.borrowerName}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{row.amount}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{row.interest}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{row.tenure}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{row.repaymentAmount ?? ""}</td>
                {showInternalFields && <td className="px-3 py-3 text-center text-muted-foreground">{row.virtualBank}</td>}
                {showInternalFields && <td className="px-3 py-3 text-center text-muted-foreground">{row.approvedBy ?? "-"}</td>}
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {row.status === "PENDING" || !row.status ? (
                    allowActions ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="w-8 h-8 rounded-full bg-approve text-approve-foreground text-sm font-semibold disabled:opacity-60"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => setPendingDecision({ id: row.id, status: "APPROVED", borrowerName: row.borrowerName })}
                          aria-label="Approve loan"
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => setPendingDecision({ id: row.id, status: "REJECTED", borrowerName: row.borrowerName })}
                          aria-label="Reject loan"
                          title="Reject"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      "PENDING"
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span>{row.status ?? "-"}</span>
                      {row.status === "APPROVED" && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {(row.repaymentStatus ?? "PENDING").replace("_", " ")}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {!isLoading && !isError && pageRows.length === 0 && (
              <tr className="border-b border-border">
                <td colSpan={showInternalFields ? 8 : 6} className="px-3 py-3 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );

    if (paginate) {
      return (
        <TablePaginator items={rows} pageSize={10} renderPage={(pageItems) => renderTable(pageItems)} />
      );
    }

    return renderTable(rows);
  };

  return (
    <>
      <div className="space-y-6">
        {isManagement ? (
          <>
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 pb-2 border-b border-border">
                <h2 className="text-lg font-light text-foreground">My Loans</h2>
              </div>
              {renderLoanTable(
                personalLoans ?? [],
                isPersonalLoading,
                isPersonalError,
                personalError,
                "No personal loans found.",
                false
              )}
            </div>

            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 pb-2 border-b border-border">
                <h2 className="text-lg font-light text-foreground">Other Employees Loans</h2>
              </div>
              {renderLoanTable(
                employeeLoans,
                isTenantLoading,
                isTenantError,
                tenantError,
                "No employee loans found.",
                true,
                true,
                true
              )}
            </div>
            {renderOutstandingRepayments()}
          </>
        ) : (
          <>
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 pb-2 border-b border-border">
                <h2 className="text-lg font-light text-foreground">Loans</h2>
              </div>
              {renderLoanTable(
                personalLoans ?? [],
                isPersonalLoading,
                isPersonalError,
                personalError,
                "No loans found.",
                false
              )}
            </div>
            {renderOutstandingRepayments()}
          </>
        )}
      </div>

      {historyLoan && (
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 pb-2 border-b border-border">
            <div>
              <h2 className="text-lg font-light text-foreground">Payment History · Loan #{historyLoan.id}</h2>
              <p className="text-xs text-muted-foreground mt-1">Payments are immutable and show the wallet that funded each one.</p>
            </div>
            <button onClick={() => setHistoryLoan(null)} className="text-sm font-semibold text-primary">Close</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-table-header text-table-header-foreground"><th className="px-3 py-3 text-left">Paid By</th><th className="px-3 py-3 text-center">Role</th><th className="px-3 py-3 text-center">Amount</th><th className="px-3 py-3 text-center">Date</th></tr></thead>
              <tbody>
                {repaymentHistoryQuery.isLoading && <tr><td colSpan={4} className="px-3 py-3 text-center text-muted-foreground">Loading payment history...</td></tr>}
                {repaymentHistoryQuery.isError && <tr><td colSpan={4} className="px-3 py-3 text-center text-destructive">{(repaymentHistoryQuery.error as Error)?.message ?? "Unable to load payment history."}</td></tr>}
                {!repaymentHistoryQuery.isLoading && !repaymentHistoryQuery.isError && (repaymentHistoryQuery.data ?? []).map((payment) => <tr key={payment.id} className="border-b border-border"><td className="px-3 py-3 text-muted-foreground">{payment.paidByName ?? "-"}</td><td className="px-3 py-3 text-center text-muted-foreground">{payment.paidByRole ?? "-"}</td><td className="px-3 py-3 text-center font-medium">GHS {Number(payment.amount).toFixed(2)}</td><td className="px-3 py-3 text-center text-muted-foreground">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "-"}</td></tr>)}
                {!repaymentHistoryQuery.isLoading && !repaymentHistoryQuery.isError && (repaymentHistoryQuery.data ?? []).length === 0 && <tr><td colSpan={4} className="px-3 py-3 text-center text-muted-foreground">No payments recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!pendingDecision}
        onOpenChange={(open) => {
          if (!open) setPendingDecision(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDecision?.status === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDecision?.status === "APPROVED"
                ? `Are you sure you want to approve ${pendingDecision?.borrowerName ?? "this"} loan request?`
                : `Are you sure you want to reject ${pendingDecision?.borrowerName ?? "this"} loan request?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateStatusMutation.isPending || !pendingDecision}
              onClick={() => {
                if (!pendingDecision) return;
                updateStatusMutation.mutate(
                  { id: pendingDecision.id, status: pendingDecision.status },
                  {
                    onSettled: () => setPendingDecision(null),
                  }
                );
              }}
              className="flex items-center justify-center gap-2"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {pendingDecision?.status === "APPROVED" ? "Approving..." : "Rejecting..."}
                </>
              ) : (
                pendingDecision?.status === "APPROVED" ? "Approve" : "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingRepayment} onOpenChange={(open) => { if (!open) setPendingRepayment(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm repayment</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRepayment && pendingRepayment.loan.borrowerId !== user?.id
                ? `GHS ${pendingRepayment.amount.toFixed(2)} will be debited from your wallet and applied to ${pendingRepayment.loan.borrowerName ?? "this employee"}'s loan.`
                : `GHS ${pendingRepayment?.amount.toFixed(2) ?? "0.00"} will be debited from your wallet and applied to your loan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={repaymentMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!pendingRepayment || repaymentMutation.isPending}
              className="flex items-center justify-center gap-2"
              onClick={() => {
                if (!pendingRepayment) return;
                repaymentMutation.mutate(
                  { id: pendingRepayment.loan.id, amount: pendingRepayment.amount },
                  { onSettled: () => setPendingRepayment(null) },
                );
              }}
            >
              {repaymentMutation.isPending ? <><Spinner size="sm" /> Paying...</> : "Confirm payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LoansPage;
