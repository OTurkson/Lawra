const loansData = [
  { name: "Nana Yaw", amount: 700, interest: "12.5%", virtualBank: "Abusia Funds", tenure: "7 mon.", installment: 110, bank: "Cal Bank", accName: "Nana Yaw", accNumber: "2901377193010" },
  { name: "Nana Yaw", amount: 500, interest: "13.5%", virtualBank: "", tenure: "", installment: 0, bank: "Rep. Bank", accName: "", accNumber: "3490734003608" },
  { name: "Kwame Osei", amount: 500, interest: "", virtualBank: "Kwame Funds", tenure: "5 mon.", installment: 120, bank: "", accName: "Kwame Osei", accNumber: "" },
  { name: "Akosua Mensah", amount: 1500, interest: "10.5%", virtualBank: "Bahu Funds", tenure: "12 mon.", installment: 110.50, bank: "GT Bank", accName: "Akosua Mensah", accNumber: "9284629864929" },
];

const LoansPage = () => {
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
                <th className="px-3 py-3 text-left">Name</th>
                <th className="px-3 py-3 text-center">Amount</th>
                <th className="px-3 py-3 text-center">Interest</th>
                <th className="px-3 py-3 text-center">Virtual Bank</th>
                <th className="px-3 py-3 text-center">Tenur</th>
                <th className="px-3 py-3 text-center">Installment</th>
                <th className="px-3 py-3 text-center">Bank</th>
                <th className="px-3 py-3 text-center">Acc. Name</th>
                <th className="px-3 py-3 text-center">Acc. Number</th>
              </tr>
            </thead>
            <tbody>
              {loansData.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-3 py-3 text-muted-foreground">{row.name}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.amount}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.interest}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.virtualBank}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.tenure}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.installment || ""}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.bank}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.accName}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.accNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoansPage;
