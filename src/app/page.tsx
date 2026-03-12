import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const profileComplete = (session.user as Record<string, unknown>)
      .profileComplete;
    if (!profileComplete) {
      redirect("/complete-profile");
    }
    redirect("/dashboard");
  }

  return <LoginForm />;
}
