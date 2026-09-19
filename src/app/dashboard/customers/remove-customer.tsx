"use client";

import { removeMembership } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function RemoveCustomer({ id }: { id: string }) {
  return (
    <form
      action={removeMembership.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Remove this customer and their stamps? This can't be undone.")) {
          e.preventDefault();
        }
      }}
      className="mt-3 border-t border-line-soft pt-3"
    >
      <SubmitButton className="text-sm font-medium text-danger hover:underline" spinner="h-3.5 w-3.5">
        Remove customer
      </SubmitButton>
    </form>
  );
}
