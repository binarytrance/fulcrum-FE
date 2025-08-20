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
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdFrontLoader } from "react-icons/md";
import { Button } from "@/components/ui/button";

const schema = zod.object({
  name: zod.string().min(2),
  email: zod.email(),
  username: zod.string().min(4),
  password: zod.string().min(6),
});

type FormValues = zod.infer<typeof schema>;

const Signup = () => {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", username: "", password: "" },
  });
  const [loadingUsername, setLoadingUsername] = useState(false);

  const handleGenerateUsername = useCallback(async () => {
    setLoadingUsername(true);
    const values = form.getValues();
    const suggestion = await generateUsername(values.name, values.email);
    form.setValue("username", suggestion);
    setLoadingUsername(false);
  }, [form]);

  const bypassAuth = () => {
    router.push("/goals");
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-8 font-bold text-2xl">Sign Up</h1>
      <div className="min-w-xl p-5 border rounded-sm overflow-hidden">
        {/* generate a form to sign up */}
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name" {...field} />
                </FormControl>
                {/* <FormDescription>
                  This is your public display name.
                </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>
                  Username {loadingUsername && <MdFrontLoader />}
                </FormLabel>
                <div className="flex align-middle">
                  <FormControl>
                    <Input
                      placeholder="Use AI to generate funky username"
                      {...field}
                    />
                  </FormControl>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="ms-1.5"
                    onClick={handleGenerateUsername}
                  >
                    AI
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>Email</FormLabel>
                <div className="flex align-middle">
                  <FormControl>
                    <Input placeholder="Email" {...field} />
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

export default Signup;
