import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Verify Email | CLNS",
    description: "Verify your email to continue",
};

export default function VerifyEmailPage({
    searchParams,
}: {
    searchParams: { email?: string };
}) {
    const email = searchParams.email || "your email address";

    return (
        <AuthLayout
            title="Check your email"
            subtitle="Email Verification Required"
        >
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
                <p className="text-slate-300">
                    We have sent you a verification email to <span className="font-semibold text-white">{email}</span>. 
                    Please verify it and log in.
                </p>
                <div className="w-full">
                    <Link href="/login" className="w-full block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                            Login
                        </Button>
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
