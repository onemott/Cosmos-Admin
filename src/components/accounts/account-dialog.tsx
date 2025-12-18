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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  mode: "create" | "edit" | "link";
  account?: {
    id: string;
    account_number: string;
    account_name: string;
    account_type: string;
    currency: string;
    total_value: number;
    cash_balance: number;
  };
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { value: "investment", label: "Investment" },
  { value: "custody", label: "Custody" },
  { value: "cash", label: "Cash" },
  { value: "margin", label: "Margin" },
];

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

export function AccountDialog({
  open,
  onOpenChange,
  clientId,
  mode,
  account,
  onSuccess,
}: AccountDialogProps) {
  const [formData, setFormData] = React.useState({
    account_number: "",
    account_name: "",
    account_type: "investment",
    currency: "USD",
    bank_name: "",
    total_value: "0",
    cash_balance: "0",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { toast } = useToast();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount(account?.id || "");

  React.useEffect(() => {
    if (open && account && mode === "edit") {
      setFormData({
        account_number: account.account_number,
        account_name: account.account_name,
        account_type: account.account_type,
        currency: account.currency,
        bank_name: "",
        total_value: String(account.total_value),
        cash_balance: String(account.cash_balance),
      });
    } else if (open && mode === "create") {
      setFormData({
        account_number: "",
        account_name: "",
        account_type: "investment",
        currency: "USD",
        bank_name: "",
        total_value: "0",
        cash_balance: "0",
      });
    }
    setErrors({});
  }, [open, account, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_number.trim()) {
      newErrors.account_number = "Account number is required";
    }
    if (!formData.account_name.trim()) {
      newErrors.account_name = "Account name is required";
    }
    if (isNaN(parseFloat(formData.total_value))) {
      newErrors.total_value = "Invalid total value";
    }
    if (isNaN(parseFloat(formData.cash_balance))) {
      newErrors.cash_balance = "Invalid cash balance";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          client_id: clientId,
          account_number: formData.account_number.trim(),
          account_name: formData.account_name.trim(),
          account_type: formData.account_type,
          currency: formData.currency,
          total_value: parseFloat(formData.total_value) || 0,
          cash_balance: parseFloat(formData.cash_balance) || 0,
        });
        toast({ title: "Success", description: "Account created successfully" });
      } else if (mode === "edit" && account) {
        await updateMutation.mutateAsync({
          account_name: formData.account_name.trim(),
          account_type: formData.account_type,
          currency: formData.currency,
          total_value: parseFloat(formData.total_value) || 0,
          cash_balance: parseFloat(formData.cash_balance) || 0,
        });
        toast({ title: "Success", description: "Account updated successfully" });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast({ title: "Error", description: axiosError.response?.data?.detail || "Failed to save account", variant: "destructive" });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Account" : "Edit Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Manually create a new investment account for this client."
              : "Update account details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                placeholder="e.g., 12345678"
                disabled={mode === "edit"}
              />
              {errors.account_number && (
                <p className="text-sm text-red-500">{errors.account_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_name: e.target.value })
                }
                placeholder="e.g., Main Investment"
              />
              {errors.account_name && (
                <p className="text-sm text-red-500">{errors.account_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger id="account_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_value">Total Value</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                value={formData.total_value}
                onChange={(e) =>
                  setFormData({ ...formData, total_value: e.target.value })
                }
                placeholder="0.00"
              />
              {errors.total_value && (
                <p className="text-sm text-red-500">{errors.total_value}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash_balance">Cash Balance</Label>
              <Input
                id="cash_balance"
                type="number"
                step="0.01"
                value={formData.cash_balance}
                onChange={(e) =>
                  setFormData({ ...formData, cash_balance: e.target.value })
                }
                placeholder="0.00"
              />
              {errors.cash_balance && (
                <p className="text-sm text-red-500">{errors.cash_balance}</p>
              )}
            </div>
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank/Custodian Name (Optional)</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
                placeholder="e.g., UBS, Credit Suisse"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Account" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

