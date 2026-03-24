'use client';

import { Button } from '@/components/ui/button';
import { Snackbar } from '@/components/ui/snackbar';
import { useAuthStore } from '@/store/auth-store';
import { authApiFetch } from '@/utils/auth-api';
import {
    getApiMessage,
    getGoals,
    updateGoal,
    type GoalResponse,
    type GoalTreeNode
} from '@/utils/goals-api';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CreateGoalForm } from './components/CreateGoalForm';
import { GoalsList } from './components/GoalsList';

type GoalEditorState = { mode: 'create' } | { mode: 'edit'; goal: GoalTreeNode } | null;

const GoalsPage = () => {
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const clearAuth = useAuthStore(state => state.clearAuth);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [goalEditor, setGoalEditor] = useState<GoalEditorState>(null);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
    const [goalsLoading, setGoalsLoading] = useState(false);
    const [goalsError, setGoalsError] = useState<string | null>(null);
    const [goals, setGoals] = useState<GoalTreeNode[] | null>(null);
    const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());

    const isAuthedLabel = user?.email
        ? `Signed in as ${String(user.email)}`
        : 'Signed in with cookie session';

    const fetchGoals = useCallback(async () => {
        setGoalsLoading(true);
        setGoalsError(null);

        try {
            const { response, payload } = await getGoals();
            if (response.status === 401) {
                clearAuth();
                router.replace('/signin');
                return;
            }
            if (!response.ok) {
                setGoalsError('Could not load goals right now.');
                return;
            }

            if (!payload || !('success' in payload) || !payload.success) {
                setGoalsError('Could not load goals right now.');
                return;
            }

            setGoals(payload.data ?? null);
        } catch {
            setGoalsError('Could not load goals right now.');
        } finally {
            setGoalsLoading(false);
        }
    }, [clearAuth, router]);

    useEffect(() => {
        void fetchGoals();
    }, [fetchGoals]);

    const handleLogout = async () => {
        setLogoutLoading(true);
        setLogoutError(null);

        try {
            const response = await authApiFetch('/logout', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Could not log out right now.');
            }

            clearAuth();
            router.replace('/signin');
        } catch (cause) {
            setLogoutError(cause instanceof Error ? cause.message : 'Could not log out right now.');
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleComplete = async (goalId: string) => {
        setCompletingIds(prev => new Set(prev).add(goalId));

        try {
            const { response, payload } = await updateGoal(goalId, {
                status: 'COMPLETED'
            });

            if (response.status === 401) {
                clearAuth();
                router.replace('/signin');
                return;
            }

            if (!response.ok) {
                setSnackbarMessage(
                    getApiMessage(payload && 'message' in payload ? payload.message : undefined)
                );
                return;
            }

            if (payload && 'success' in payload && payload.success) {
                setSnackbarMessage(payload.message);
            } else {
                setSnackbarMessage('Goal updated.');
            }

            await fetchGoals();
        } finally {
            setCompletingIds(prev => {
                const next = new Set(prev);
                next.delete(goalId);
                return next;
            });
        }
    };

    return (
        <main className='mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-8'>
            <div className='flex flex-col gap-3 rounded-md border p-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                    <h1 className='text-2xl font-bold'>Goals</h1>
                    <p className='text-sm text-muted-foreground'>{isAuthedLabel}</p>
                </div>

                <Button variant='destructive' onClick={handleLogout} disabled={logoutLoading}>
                    {logoutLoading ? 'Logging out...' : 'Logout'}
                </Button>
            </div>

            {logoutError ? <p className='text-sm text-destructive'>{logoutError}</p> : null}

            {goalEditor ? (
                <CreateGoalForm
                    mode={goalEditor.mode}
                    initialGoal={goalEditor.mode === 'edit' ? goalEditor.goal : undefined}
                    onCancel={() => setGoalEditor(null)}
                    onUnauthorized={() => {
                        clearAuth();
                        router.replace('/signin');
                    }}
                    onSaved={(_goal: GoalResponse, message: string) => {
                        setSnackbarMessage(message);
                        setGoalEditor(null);
                        fetchGoals();
                    }}
                />
            ) : (
                <section className='rounded-md border p-5'>
                    <div className='flex items-center justify-between gap-3'>
                        <h2 className='text-lg font-semibold'>Your goals</h2>
                        <Button onClick={() => setGoalEditor({ mode: 'create' })}>
                            Create goal
                        </Button>
                    </div>

                    <GoalsList
                        loading={goalsLoading}
                        error={goalsError}
                        goals={goals}
                        completingIds={completingIds}
                        onComplete={handleComplete}
                        onEdit={goal => {
                            setGoalEditor({ mode: 'edit', goal });
                        }}
                    />
                </section>
            )}

            <Snackbar message={snackbarMessage} onDismiss={() => setSnackbarMessage(null)} />
        </main>
    );
};

export default GoalsPage;
