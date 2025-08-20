"use client";

import { generateUsername } from "@/actions/generate-username";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

const schema = zod.object({
  username: zod.string().min(4),
  password: zod.string().min(6),
});

type FormValues = zod.infer<typeof schema>;

const SignIn = () => {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const bypassAuth = () => {
    router.push("/goals");
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-8 font-bold text-2xl">Sign In</h1>
      <div className="min-w-xl p-5 border rounded-sm overflow-hidden">
        {/* generate a form to sign up */}
        <Form {...form}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>Username/Email</FormLabel>
                <div className="flex align-middle">
                  <FormControl>
                    <Input placeholder="Enter your email/username" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>Password</FormLabel>
                <div className="flex align-middle">
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex">
            <Button type="submit">Let&#39;s Go!</Button>
            <Button
              variant="destructive"
              type="button"
              onClick={bypassAuth}
              className="ml-auto"
            >
              Bypass auth!
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SignIn;
