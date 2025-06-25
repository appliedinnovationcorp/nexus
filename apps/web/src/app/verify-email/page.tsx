"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const searchParams = useSearchParams();
  const { confirmEmail, resendConfirmation } = useAuth();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    // If there's a token in the URL, automatically verify
    if (token) {
      handleTokenVerification(token);
    }
  }, [token]);

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleTokenVerification = async (verificationToken: string) => {
    try {
      await confirmEmail(verificationToken);
    } catch (error) {
      console.error("Email verification failed:", error);
    }
  };

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await resendConfirmation(email);
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error("Failed to resend email:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {email && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Verification email sent to:
                </p>
                <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {email}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Check your inbox</p>
                  <p>Click the verification link in the email we sent you</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Check spam folder</p>
                  <p>Sometimes emails end up in spam or promotions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Link expires in 24 hours</p>
                  <p>Make sure to verify your email within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                Didn't receive the email?
              </p>
              
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0 || !email}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Email
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact our{" "}
            <Link href="/support" className="text-blue-600 hover:text-blue-500">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
