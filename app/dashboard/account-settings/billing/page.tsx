import { redirect } from "next/navigation"

/** Legacy path — canonical billing UI lives at /billing */
export default function DashboardBillingRedirect() {
  redirect("/billing")
}
