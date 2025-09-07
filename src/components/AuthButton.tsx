"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

export function AuthButton() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/signin");
  };

  const handleSignIn = () => {
    router.push("/signin");
  };

  if (loading) {
    return <Button variant="outline" size="sm" disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <Button onClick={handleSignOut} variant="ghost" size="sm">
        <LogOut className="mr-2 h-4 w-4" /> Sign Out
      </Button>
    );
  }

  return (
    <Button onClick={handleSignIn} variant="outline" size="sm">
      <LogIn className="mr-2 h-4 w-4" /> Sign In
    </Button>
  );
}
