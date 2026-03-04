const virtualBanksData = [
  { name: "Nana Yaw", amount: 14400, interest: "17.2%" },
  { name: "Nana Yaw", amount: "", interest: "" },
  { name: "Nana Yaw", amount: "", interest: "" },
];

const bankAccounts = [
  { bank: "Cal Bank", account: "0248828783428364" },
  { bank: "Republic Bank", account: "0248828783428364" },
  { bank: "Omni Bank", account: "0248828783428364" },
];

const VirtualBanksPage = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Banks */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground">Virtual Banks</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-muted-foreground font-normal">Name</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Amount</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Interest</th>
              </tr>
            </thead>
            <tbody>
              {virtualBanksData.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground">{row.name}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{row.amount}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{row.interest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bank Accounts */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground">Bank Accounts</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-muted-foreground font-normal">Banks</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Account Number</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground">{row.bank}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{row.account}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VirtualBanksPage;
