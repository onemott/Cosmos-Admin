"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAccounts, useReassignAccount } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LinkAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

interface Account {
  id: string;
  client_id: string;
  account_number: string;
  account_number_masked: string;
  account_name: string;
  account_type: string;
  currency: string;
  total_value: number;
  client_name: string | null;
  is_active: boolean;
}

export function LinkAccountDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: LinkAccountDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all active accounts that could potentially be reassigned
  const { data: accountsData, isLoading } = useAccounts({ is_active: true, limit: 100 });
  const reassignMutation = useReassignAccount();

  // Filter out accounts already assigned to this client
  const availableAccounts = React.useMemo(() => {
    const responseData = accountsData as { accounts?: Account[] } | undefined;
    if (!responseData?.accounts) return [];
    return responseData.accounts.filter(
      (acc) => acc.client_id !== clientId
    );
  }, [accountsData, clientId]);

  // Filter by search term
  const filteredAccounts = React.useMemo(() => {
    if (!searchTerm.trim()) return availableAccounts;
    const term = searchTerm.toLowerCase();
    return availableAccounts.filter(
      (acc) =>
        acc.account_name.toLowerCase().includes(term) ||
        acc.account_number.toLowerCase().includes(term) ||
        acc.client_name?.toLowerCase().includes(term)
    );
  }, [availableAccounts, searchTerm]);

  const handleLink = async () => {
    if (!selectedAccountId) return;

    try {
      await reassignMutation.mutateAsync({
        accountId: selectedAccountId,
        clientId,
      });
      toast({ title: "Success", description: "Account linked successfully" });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast({ title: "Error", description: axiosError.response?.data?.detail || "Failed to link account", variant: "destructive" });
    }
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm("");
      setSelectedAccountId(null);
    }
  }, [open]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Link Existing Account</DialogTitle>
          <DialogDescription>
            Select an account to reassign to this client. The account will be moved from its current client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by account name, number, or current client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg max-h-[300px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {availableAccounts.length === 0
                  ? "No accounts available to link"
                  : "No accounts match your search"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Current Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow
                      key={account.id}
                      className={`cursor-pointer ${
                        selectedAccountId === account.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedAccountId(account.id)}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          checked={selectedAccountId === account.id}
                          onChange={() => setSelectedAccountId(account.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{account.account_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.account_number_masked}
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.client_name || (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {account.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(account.total_value, account.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reassignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedAccountId || reassignMutation.isPending}
          >
            {reassignMutation.isPending ? "Linking..." : "Link Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

