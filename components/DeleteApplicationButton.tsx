"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteApplicationButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-neutral-400 hover:text-rose-600"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">Delete this record?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Confirm"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-neutral-400 hover:text-neutral-600">
        Cancel
      </button>
    </span>
  );
}
