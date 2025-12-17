'use client';

import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/hooks/useToast';
import { AtSign, LogInSquare } from '@/svg_components';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { z } from 'zod';

const emailSchema = z.string().trim().email();
const otpSchema = z.string().trim().length(6, 'Code must be 6 digits');

export function OtpAuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/feed';
  const { showToast } = useToast();

  const onEmailChange = useCallback((text: string) => {
    setEmail(text);
    setEmailError(null);
  }, []);

  const onOtpChange = useCallback((text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numericValue);
    setOtpError(null);
  }, []);

  const submitEmail = useCallback(async () => {
    setLoading(true);
    setEmailError(null);

    const validateEmail = emailSchema.safeParse(email);
    if (!validateEmail.success) {
      setEmailError(validateEmail.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      setStep('otp');
      showToast({
        type: 'success',
        title: 'Code Sent',
        message: 'Check your email for the 6-digit code.',
      });
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to send code' });
    } finally {
      setLoading(false);
    }
  }, [email, showToast]);

  const submitOtp = useCallback(async () => {
    setLoading(true);
    setOtpError(null);

    const validateOtp = otpSchema.safeParse(otp);
    if (!validateOtp.success) {
      setOtpError(validateOtp.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.error || 'Invalid code');
        setLoading(false);
        return;
      }

      // Session cookie set, redirect to callback URL
      showToast({
        type: 'success',
        title: 'Signed in successfully!',
      });
      
      // Redirect to callback URL
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 500);
    } catch (error) {
      showToast({ type: 'error', title: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }, [email, otp, callbackUrl, showToast]);

  const resendCode = useCallback(async () => {
    setOtp('');
    setOtpError(null);
    await submitEmail();
  }, [submitEmail]);

  if (step === 'otp') {
    return (
      <>
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
          <TextInput
            value={otp}
            onChange={onOtpChange}
            label="6-Digit Code"
            errorMessage={otpError || undefined}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            autoFocus
          />
        </div>
        <Button
          onClick={submitOtp}
          isDisabled={loading || otp.length !== 6}
          loading={loading}
          className="mb-4 w-full"
        >
          <LogInSquare />
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
        <div className="text-center">
          <button
            onClick={resendCode}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            Resend Code
          </button>
          <span className="mx-2 text-gray-400">•</span>
          <button
            onClick={() => {
              setStep('email');
              setOtp('');
              setOtpError(null);
            }}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            Change Email
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4">
        <TextInput
          value={email}
          onChange={onEmailChange}
          label="Email"
          errorMessage={emailError || undefined}
          Icon={AtSign}
          autoFocus
        />
      </div>
      <Button onClick={submitEmail} isDisabled={loading} loading={loading} className="mb-4 w-full">
        <LogInSquare />
        Continue with Email
      </Button>
    </>
  );
}

