"use client";

import { removeMembership } from "@/app/actions";

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
      <button className="text-sm font-medium text-danger hover:underline">
        Remove customer
      </button>
    </form>
  );
}
