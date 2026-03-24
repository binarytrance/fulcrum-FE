'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { authApiFetch } from '@/utils/auth-api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type MeResponse = {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
};

const GoogleSigninCallbackPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore(state => state.setUser);
    const status = searchParams.get('status');
    const callbackMessage = searchParams.get('message');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const completeGoogleSignin = async () => {
            if (status === 'error') {
                setError(callbackMessage ?? 'Google sign in failed.');
                setLoading(false);
                return;
            }

            if (status !== 'success') {
                setError('Invalid callback status.');
                setLoading(false);
                return;
            }

            try {
                const response = await authApiFetch('/me');
                const payload = (await response.json()) as MeResponse;

                if (!response.ok || !payload.success || !payload.data) {
                    throw new Error(payload.message || 'Could not verify signed in user.');
                }

                setUser(payload.data);
                router.replace('/goals');
            } catch (error) {
                if (!isMounted) return;
                setError(error instanceof Error ? error.message : 'Could not complete Google sign in.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        completeGoogleSignin();

        return () => {
            isMounted = false;
        };
    }, [callbackMessage, router, setUser, status]);

    if (error) {
        return (
            <div className='mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center'>
                <h1 className='text-2xl font-bold'>Google Sign In Failed</h1>
                <p className='mt-3 text-sm text-destructive'>{error}</p>
                <Button asChild className='mt-6' variant='secondary'>
                    <Link href='/signin'>Try again</Link>
                </Button>
            </div>
        );
    }

    if (!loading) {
        return null;
    }

    return (
        <div className='mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center'>
            <h1 className='text-2xl font-bold'>Completing Google Sign In</h1>
            <p className='mt-3 text-sm text-muted-foreground'>
                Please wait while we finish authentication.
            </p>
        </div>
    );
};

export default GoogleSigninCallbackPage;

