import { redirect } from "next/navigation";

export default function RootRedirect() {
  redirect("/it"); // default = Italian (For now)
}