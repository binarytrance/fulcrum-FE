'use client';

import { generateUsername } from '@/actions/generate-username';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApiFetch } from '@/utils/auth-api';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdFrontLoader } from 'react-icons/md';
import * as zod from 'zod';
import styles from './styles/EmailSignupForm.module.css';

const schema = zod.object({
    firstname: zod.string().min(2, 'First name is required'),
    lastname: zod.string().min(2, 'Last name is required'),
    email: zod.email('Enter a valid email'),
    username: zod.string().min(4, 'Username should be at least 4 characters'),
    password: zod.string().min(6, 'Password should be at least 6 characters')
});

type FormValues = zod.infer<typeof schema>;

type EmailSignupFormProps = {
    onBack: () => void;
};

type SignupResponse = {
    success: boolean;
    message: string;
};

export function EmailSignupForm({ onBack }: EmailSignupFormProps) {
    const [requestError, setRequestError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loadingUsername, setLoadingUsername] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstname: '',
            lastname: '',
            email: '',
            username: '',
            password: ''
        }
    });

    const handleGenerateUsername = useCallback(async () => {
        setLoadingUsername(true);
        setRequestError(null);

        try {
            const values = form.getValues();
            const fullName = `${values.firstname} ${values.lastname}`.trim();
            const suggestion = await generateUsername(fullName, values.email);
            form.setValue('username', suggestion, { shouldValidate: true });
        } catch {
            setRequestError('Could not generate username right now. Please try again.');
        } finally {
            setLoadingUsername(false);
        }
    }, [form]);

    const onSubmit = form.handleSubmit(async values => {
        setRequestError(null);
        setSuccessMessage(null);

        try {
            const response = await authApiFetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            const payload = (await response.json()) as SignupResponse;

            if (!response.ok || !payload.success) {
                setRequestError(payload.message || 'Signup failed. Please try again.');
                return;
            }

            setSuccessMessage(payload.message || 'Signup successful. Verify your email.');
            form.reset();
        } catch {
            setRequestError('Could not complete signup. Please try again.');
        }
    });

    return (
        <div className='w-full max-w-xl rounded-md border p-5'>
            <h1 className='mb-2 text-2xl font-bold'>Create Account with Email</h1>
            <p className='mb-6 text-sm text-muted-foreground'>
                Already have an account?{' '}
                <Link href='/signin' className='underline'>
                    Sign in
                </Link>
            </p>

            <Form {...form}>
                <form onSubmit={onSubmit} className='space-y-5'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <FormField
                            control={form.control}
                            name='firstname'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder='First name' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='lastname'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder='Last name' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder='Email' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='username'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Username
                                    {loadingUsername ? (
                                        <MdFrontLoader className={styles.loaderIcon} />
                                    ) : null}
                                </FormLabel>
                                <div className='flex items-center gap-2'>
                                    <FormControl>
                                        <Input
                                            placeholder='Use AI to generate funky username'
                                            autoComplete='username'
                                            {...field}
                                        />
                                    </FormControl>
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        size='sm'
                                        onClick={handleGenerateUsername}
                                        disabled={loadingUsername}
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
                        name='password'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type='password' placeholder='Password' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {requestError ? (
                        <p className='text-sm text-destructive'>{requestError}</p>
                    ) : null}

                    {successMessage ? (
                        <p className='text-sm text-green-600'>{successMessage}</p>
                    ) : null}

                    <div className='flex flex-col-reverse gap-2 sm:flex-row sm:items-center'>
                        <Button type='button' variant='secondary' onClick={onBack}>
                            Back
                        </Button>
                        <Button type='submit' disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
