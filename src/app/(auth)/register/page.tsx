'use client';

import Link from 'next/link';
import { UserAuthForm } from '../UserAuthForm';
import { OtpAuthForm } from '../OtpAuthForm';
import { useState } from 'react';

export default function Page() {
  const [useOtp, setUseOtp] = useState(true); // Default to OTP for PWA

  return (
    <>
      <h1 className="mb-5 text-5xl font-bold">Sign Up</h1>
      <p className="mb-4 text-lg text-muted-foreground">
        {useOtp ? 'Enter your email to receive a code' : 'Enter your email to create an account'}
      </p>
      {useOtp ? <OtpAuthForm mode="register" /> : <UserAuthForm mode="register" />}
      <div className="mb-4 text-center">
        <button
          onClick={() => setUseOtp(!useOtp)}
          className="text-sm text-blue-600 hover:underline"
        >
          {useOtp ? 'Use magic link instead' : 'Use code instead'}
        </button>
      </div>
      <p className="text-lg text-muted-foreground">Already have an account?</p>
      <p className="cursor-pointer text-lg font-semibold text-primary-accent hover:opacity-90">
        <Link href="/login" prefetch>
          Login
        </Link>
      </p>
    </>
  );
}
