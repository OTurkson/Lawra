const lenderData = [
  { fund: "Abusuia", lending: 600, interest: "12.5%", tenure: "6 months", installment: 100, lenders: 2 },
];

const LenderPage = () => {
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
            {lenderData.map((row, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">{row.fund}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.lending}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.interest}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.tenure}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.installment}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.lenders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FUNDS / Approve / Decline */}
      <div className="bg-card rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-muted-foreground text-lg tracking-widest">FUNDS</p>
        <div className="flex items-center justify-center gap-12">
          <button className="px-10 py-2 rounded-full bg-approve text-approve-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Approve
          </button>
          <button className="px-10 py-2 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default LenderPage;
