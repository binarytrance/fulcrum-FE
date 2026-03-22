"use client";

import { useState } from "react";
import { EmailSignupForm } from "./components/EmailSignupForm";
import { GoogleSignupButton } from "./components/GoogleSignupButton";
import { SignupMethodSelector } from "./components/SignupMethodSelector";

const Signup = () => {
  const [method, setMethod] = useState<"selector" | "email">("selector");

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      {method === "selector" ? (
        <SignupMethodSelector
          onContinueWithEmail={() => setMethod("email")}
          signupButtons={[<GoogleSignupButton key="google" />]}
        />
      ) : (
        <EmailSignupForm onBack={() => setMethod("selector")} />
      )}
    </div>
  );
};

export default Signup;
