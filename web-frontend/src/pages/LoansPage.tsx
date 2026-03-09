import { useQuery } from "@tanstack/react-query";
import { fetchLoans, LoanSummary } from "@/lib/api";

const LoansPage = () => {
  const { data, isLoading, isError, error } = useQuery<LoanSummary[]>({
    queryKey: ["loans"],
    queryFn: () => fetchLoans(),
  });

  const hasRemoteData = Array.isArray(data) && data.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-foreground">Loans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-3 py-3 text-left">Borrower</th>
                <th className="px-3 py-3 text-center">Loan Amount</th>
                <th className="px-3 py-3 text-center">Interest Rate</th>
                <th className="px-3 py-3 text-center">Tenure</th>
                <th className="px-3 py-3 text-center">Repayment Amount</th>
                <th className="px-3 py-3 text-center">Bank</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr className="border-b border-border">
                  <td colSpan={7} className="px-3 py-3 text-center text-muted-foreground">
                    Loading loans...
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr className="border-b border-border">
                  <td colSpan={7} className="px-3 py-3 text-center text-destructive">
                    {(error as Error)?.message ?? "Unable to load loans."}
                  </td>
                </tr>
              )}

              {!isLoading && hasRemoteData &&
                data!.map((row) => (
                  <tr key={row.id} className="border-b border-border">
                    <td className="px-3 py-3 text-muted-foreground">{row.borrowerName}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.amount}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.interest}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.tenure}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{row.repaymentAmount ?? ""}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.bank}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.status}</td>
                  </tr>
                ))}

              {!isLoading && !isError && !hasRemoteData && (
                <tr className="border-b border-border">
                  <td colSpan={7} className="px-3 py-3 text-center text-muted-foreground">
                    No loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoansPage;
