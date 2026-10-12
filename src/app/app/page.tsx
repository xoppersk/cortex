import { redirect } from "next/navigation";

// The app section root lands on the designed app home (new conversation),
// matching every entry flow in the designs.
export default function AppIndexPage() {
  redirect("/app/new");
}
