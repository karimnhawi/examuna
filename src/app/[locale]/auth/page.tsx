"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");

  const handleEmailAuth = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOtp({ email });
    alert("Check your inbox for the secure login link.");
  };

  const googleAuth = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <main className="container py-14">
      <Card className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to Examuna</h1>
        <p className="text-sm text-muted-foreground">Use your teacher email or continue with Google.</p>
        <Input type="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={handleEmailAuth} className="w-full">Continue with email</Button>
        <Button variant="outline" onClick={googleAuth} className="w-full">Continue with Google</Button>
      </Card>
    </main>
  );
}
