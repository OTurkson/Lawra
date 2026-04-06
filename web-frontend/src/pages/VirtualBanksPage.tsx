import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createVirtualBank, fetchLoanPackages, LoanPackage } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const VirtualBanksPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const auth = getAuth();

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  const {
    data: loanPackages,
    isLoading: isLoanPackagesLoading,
    isError: isLoanPackagesError,
    error: loanPackagesError,
  } = useQuery<LoanPackage[]>({
    queryKey: ["loan-packages"],
    queryFn: fetchLoanPackages,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!auth?.userId || !auth?.tenantId) throw new Error("You must be logged in to create a virtual bank.");
      if (!name) throw new Error("Virtual bank name is required.");

      return createVirtualBank({
        name,
        balance: balance ? Number(balance) : undefined,
        createdById: auth.userId,
        tenantId: auth.tenantId,
      });
    },
    onSuccess: () => {
      setName("");
      setBalance("");
      queryClient.invalidateQueries({ queryKey: ["virtual-banks"] });
      toast({ title: "Virtual bank created" });
    },
    onError: (error: any) => {
      toast({ title: "Create failed", description: error?.message ?? "Unable to create virtual bank." });
    },
  });

  const hasLoanPackageData = Array.isArray(loanPackages) && loanPackages.length > 0 && !isLoanPackagesError;

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
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Virtual Bank</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Interest Rate</th>
              </tr>
            </thead>
            <tbody>
              {isLoanPackagesLoading && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground" colSpan={3}>
                    Loading loan packages...
                  </td>
                </tr>
              )}

              {!isLoanPackagesLoading && isLoanPackagesError && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-destructive text-center" colSpan={3}>
                    {(loanPackagesError as Error)?.message ?? "Unable to load loan packages."}
                  </td>
                </tr>
              )}

              {!isLoanPackagesLoading && hasLoanPackageData &&
                loanPackages!.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-border">
                    <td className="px-4 py-2 text-muted-foreground">Package #{pkg.id}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{pkg.virtualBank?.name ?? "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{pkg.interestRate ?? "-"}</td>
                  </tr>
                ))}

              {!isLoanPackagesLoading && !hasLoanPackageData && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground text-center" colSpan={3}>
                    No loan packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Loan Packages */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-light text-foreground">Loan Packages</h2>
          </div>
          <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Virtual bank name"
              className="flex-1 px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
            />
            <input
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Opening balance"
              className="flex-1 px-4 py-2 rounded-full border border-primary/40 bg-card text-foreground"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-muted-foreground font-normal">Name</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Virtual Bank</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-normal">Interest Rate</th>
              </tr>
            </thead>
            <tbody>
              {isLoanPackagesLoading && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground text-center" colSpan={3}>
                    Loading loan packages...
                  </td>
                </tr>
              )}
              {!isLoanPackagesLoading && isLoanPackagesError && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-destructive text-center" colSpan={3}>
                    {(loanPackagesError as Error)?.message ?? "Unable to load loan packages."}
                  </td>
                </tr>
              )}
              {!isLoanPackagesLoading && hasLoanPackageData &&
                loanPackages!.map((pkg) => (
                  <tr key={`pkg-${pkg.id}`} className="border-b border-border">
                    <td className="px-4 py-2 text-muted-foreground">Package #{pkg.id}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{pkg.virtualBank?.name ?? "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{pkg.interestRate ?? "-"}</td>
                  </tr>
                ))}
              {!isLoanPackagesLoading && !hasLoanPackageData && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground text-center" colSpan={3}>
                    No loan packages found.
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

export default VirtualBanksPage;
