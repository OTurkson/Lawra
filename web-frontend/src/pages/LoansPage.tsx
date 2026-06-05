import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBorrowerLoans, fetchLoans, LoanSummary, LoanStatus, updateLoanStatus } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import TablePaginator from "@/components/ui/TablePaginator";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { getAuth } from "@/lib/auth";
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
  const isPaymaster = user?.role === "PAYMASTER";
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
    enabled: !!user?.id && isPaymaster,
  });

  const employeeLoans = useMemo(() => {
    if (!isPaymaster) return [];
    return (tenantLoans ?? []).filter((loan) => loan.borrowerId && loan.borrowerId !== user?.id);
  }, [isPaymaster, tenantLoans, user?.id]);

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
                    row.status ?? "-"
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
        {isPaymaster ? (
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
          </>
        ) : (
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
        )}
      </div>

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
    </>
  );
};

export default LoansPage;
