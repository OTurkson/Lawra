import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approveLoan, fetchLoans, LoanStatus, LoanSummary, rejectLoan } from "@/lib/api";

const newLoansStatic = [
  { name: "Nana Yaw", amount: 700, interest: "12.5%" },
  { name: "Nana Yaw", amount: 500, interest: "12.5%" },
  { name: "Nana Yaw", amount: 500, interest: "12.5%" },
];

const approvedLoansStatic = [
  { name: "Nana Yaw", amount: 500, interest: "12.5%" },
  { name: "Nana Yaw", amount: 500, interest: "12.5%" },
  { name: "Nana Yaw", amount: 500, interest: "12.5%" },
];

const dashboardStatic = [
  { name: "Nana Yaw", amount: 700, interest: "12.5%", tenure: "6 months", installment: 100, bank: "", account: "" },
];

const BorrowerPage = () => {
  const queryClient = useQueryClient();

  const { data: pendingLoans } = useQuery<LoanSummary[]>({
    queryKey: ["loans", "PENDING"],
    queryFn: () => fetchLoans("PENDING" as LoanStatus),
  });

  const { data: approvedLoans } = useQuery<LoanSummary[]>({
    queryKey: ["loans", "APPROVED"],
    queryFn: () => fetchLoans("APPROVED" as LoanStatus),
  });

  const { data: allLoans } = useQuery<LoanSummary[]>({
    queryKey: ["loans", "ALL"],
    queryFn: () => fetchLoans(),
  });

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
              </tr>
            </thead>
            <tbody>
              {(pendingLoans && pendingLoans.length > 0
                ? pendingLoans.map((loan) => ({
                    key: loan.id,
                    name: loan.borrowerName,
                    amount: loan.amount,
                    interest: loan.interest,
                  }))
                : newLoansStatic.map((loan, index) => ({ ...loan, key: index }))).map((loan, i) => (
                <tr key={loan.key} className="border-b border-border">
                  <td className="px-4 py-2">
                    <div className={`w-4 h-4 rounded-sm ${i === 0 ? "bg-primary" : "bg-destructive"}`} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{loan.name}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.amount}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.interest}</td>
                </tr>
              ))}
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
              {(approvedLoans && approvedLoans.length > 0
                ? approvedLoans.map((loan) => ({
                    key: loan.id,
                    name: loan.borrowerName,
                    amount: loan.amount,
                    interest: loan.interest,
                  }))
                : approvedLoansStatic.map((loan, index) => ({ ...loan, key: index }))).map((loan, i) => (
                <tr key={loan.key} className="border-b border-border">
                  <td className="px-4 py-2">
                    <div className={`w-4 h-4 rounded-sm ${i === 0 ? "bg-primary" : "bg-destructive"}`} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{loan.name}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.amount}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{loan.interest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-muted-foreground">Main Dashboard</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left">Name<br/>of Borrower</th>
              <th className="px-4 py-3 text-center">Amount (Gh¢)</th>
              <th className="px-4 py-3 text-center">Interest</th>
              <th className="px-4 py-3 text-center">Tenur</th>
              <th className="px-4 py-3 text-center">Installment</th>
              <th className="px-4 py-3 text-center">Bank</th>
              <th className="px-4 py-3 text-center">Bank<br/>Account</th>
            </tr>
          </thead>
          <tbody>
            {(allLoans && allLoans.length > 0
              ? allLoans.map((row) => ({
                  key: row.id,
                  name: row.borrowerName,
                  amount: row.amount,
                  interest: row.interest,
                  tenure: row.tenure,
                  installment: row.installment,
                  bank: row.bank,
                  account: row.accountNumber,
                }))
              : dashboardStatic.map((row, index) => ({ ...row, key: index }))).map((row) => (
              <tr key={row.key} className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">{row.name}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.amount}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.tenure}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.installment}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.bank}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.account}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LOAN / Approve / Decline */}
      <div className="bg-card rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-muted-foreground text-lg tracking-widest">LOAN</p>
        <div className="flex items-center justify-center gap-12">
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
