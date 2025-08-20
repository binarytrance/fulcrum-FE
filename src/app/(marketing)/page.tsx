import { Button } from "@/components/ui/button";
import Link from "next/link";

const MarketingPage = () => {
  return (
    <div className="flex flex-col justify-center align-middle p-20">
      <h1 className="mb-3">Welcome to Fulcrum!</h1>
      <p>Helping you meet your goals</p>
      <Link href="/signup" className="w-fit mt-4">
        <Button variant="default" size="lg" className="w-28">
          Sign Up
        </Button>
      </Link>
      <Link href="/signin" className="w-fit mt-4">
        <Button variant="secondary" size="lg" className="w-28">
          Sign In
        </Button>
      </Link>
    </div>
  );
};

export default MarketingPage;
