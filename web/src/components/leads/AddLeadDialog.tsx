import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LEAD_STATUSES,
  leadCreateSchema,
  type LeadCreateInput,
} from "@/shared";
import { ApiError } from "@/lib/api";
import { useCreateLead } from "@/hooks/useLeadMutations";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

const labels: Record<(typeof LEAD_STATUSES)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
};

export function AddLeadDialog({ open, onClose }: Props) {
  const form = useForm<LeadCreateInput>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: { name: "", email: "", phone: "", status: "NEW" },
  });

  useEffect(() => {
    if (open) form.reset({ name: "", email: "", phone: "", status: "NEW" });
  }, [open, form]);

  const mutation = useCreateLead();

  return (
    <Dialog open={open} onClose={onClose} title="Add lead" description="Create a new lead record.">
      <form
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: () => onClose(),
            onError: (err) => {
              if (err instanceof ApiError && err.fieldErrors) {
                for (const [k, v] of Object.entries(err.fieldErrors)) {
                  form.setError(k as keyof LeadCreateInput, { message: v[0] });
                }
              }
            },
          }),
        )}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} placeholder="+1 555 123 4567" />
          {form.formState.errors.phone ? (
            <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...form.register("status")} className="w-full">
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save lead"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
