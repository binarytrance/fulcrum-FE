'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as zod from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

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
import { DateTimeInput } from '@/components/ui/date-time-input';
import {
    createGoal,
    updateGoal,
    getValidationFieldErrors,
    GOAL_CATEGORIES,
    GOAL_PRIORITIES,
    type CreateGoalInput,
    type UpdateGoalInput,
    type GoalCategory,
    type GoalPriority,
    type GoalResponse
} from '@/modules/goals/api/goals-api';

type CreateGoalFormProps = {
    mode?: 'create' | 'edit';
    initialGoal?: GoalResponse;
    onSaved: (goal: GoalResponse, message: string) => void;
    onCancel: () => void;
    onUnauthorized: () => void;
};

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function toLocalDateTimeInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CreateGoalForm({
    mode = 'create',
    initialGoal,
    onSaved,
    onCancel,
    onUnauthorized
}: CreateGoalFormProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const t = useTranslations('Goals.form');
    const tCat = useTranslations('Goals.categories');
    const tPri = useTranslations('Goals.priorities');
    const tCommon = useTranslations('Common');

    const categoryLabels: Record<GoalCategory, string> = {
        HEALTH_FITNESS: tCat('HEALTH_FITNESS'),
        LEARNING: tCat('LEARNING'),
        CAREER: tCat('CAREER'),
        FINANCE: tCat('FINANCE'),
        RELATIONSHIPS: tCat('RELATIONSHIPS'),
        PERSONAL_GROWTH: tCat('PERSONAL_GROWTH'),
        CREATIVITY: tCat('CREATIVITY'),
        TRAVEL: tCat('TRAVEL'),
        OTHER: tCat('OTHER')
    };

    const priorityLabels: Record<GoalPriority, string> = {
        HIGH: tPri('HIGH'),
        MEDIUM: tPri('MEDIUM'),
        LOW: tPri('LOW')
    };

    const schema = zod.object({
        title: zod.string().min(1, t('titleRequired')).max(200, t('titleMaxLength')),
        description: zod
            .string()
            .max(1000, t('descriptionMaxLength'))
            .optional()
            .or(zod.literal('')),
        category: zod.enum(GOAL_CATEGORIES, { message: t('categoryRequired') }),
        priority: zod.enum(GOAL_PRIORITIES).optional(),
        deadline: zod.string().optional(),
        estimatedHours: zod
            .string()
            .optional()
            .or(zod.literal(''))
            .refine(
                value => value === '' || !Number.isNaN(Number(value)),
                t('estimatedHoursNaN')
            )
            .refine(value => value === '' || Number(value) > 0, t('estimatedHoursPositive'))
    });

    type FormValues = zod.infer<typeof schema>;

    const minDeadlineDate = useRef(new Date()).current;

    const defaultValues: FormValues = {
        title: initialGoal?.title ?? '',
        description: initialGoal?.description ?? '',
        category: initialGoal?.category ?? 'HEALTH_FITNESS',
        priority: initialGoal?.priority ?? undefined,
        deadline: initialGoal?.deadline
            ? toLocalDateTimeInputValue(new Date(initialGoal.deadline))
            : '',
        estimatedHours:
            typeof initialGoal?.estimatedHours === 'number'
                ? String(initialGoal.estimatedHours)
                : ''
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues
    });

    const onSubmit = form.handleSubmit(async values => {
        setSubmitError(null);

        const deadlineMs = values.deadline?.trim() ? new Date(values.deadline).getTime() : null;
        if (deadlineMs !== null && deadlineMs < Date.now()) {
            const initialDeadlineMs = initialGoal?.deadline
                ? new Date(initialGoal.deadline).getTime()
                : null;
            const isUnchangedPastDeadline = mode === 'edit' && initialDeadlineMs === deadlineMs;
            if (!isUnchangedPastDeadline) {
                form.setError('deadline', { message: t('pastDeadline') });
                return;
            }
        }

        const common = {
            title: values.title,
            category: values.category,
            priority: values.priority
        };

        const createInput: CreateGoalInput = {
            ...common,
            description: values.description?.trim() ? values.description : undefined,
            deadline: values.deadline?.trim() ? values.deadline : undefined,
            estimatedHours: values.estimatedHours?.trim()
                ? Number(values.estimatedHours)
                : undefined
        };

        const editInput: UpdateGoalInput = {
            ...common,
            description: values.description?.trim() ? values.description : null,
            deadline: values.deadline?.trim() ? values.deadline : null,
            estimatedHours: values.estimatedHours?.trim() ? Number(values.estimatedHours) : null
        };

        const { response, payload } =
            mode === 'edit' && initialGoal?.id
                ? await updateGoal(initialGoal.id, editInput)
                : await createGoal(createInput);

        if (response.status === 401) {
            onUnauthorized();
            return;
        }

        if (!response.ok) {
            const fieldErrors = getValidationFieldErrors(
                payload && 'message' in payload ? payload.message : undefined
            );
            const fields = Object.entries(fieldErrors);
            if (fields.length) {
                for (const [field, messages] of fields) {
                    const message = messages?.[0];
                    if (!message) continue;
                    form.setError(field as keyof FormValues, { message });
                }
            }

            setSubmitError(tCommon("genericError"));
            return;
        }

        if (!payload || !('success' in payload) || !payload.success || !payload.data) {
            setSubmitError(t('readResponseError'));
            return;
        }

        form.reset(defaultValues);
        onSaved(payload.data, payload.message);
    });

    const handleCancel = () => {
        setSubmitError(null);
        form.reset(defaultValues);
        onCancel();
    };

    return (
        <div className='rounded-md border p-5'>
            <h2 className='text-lg font-semibold'>
                {mode === 'edit' ? t('editTitle') : t('createTitle')}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>{t('requiredNote')}</p>

            <Form {...form}>
                <form onSubmit={onSubmit} className='mt-4 space-y-5'>
                    <FormField
                        control={form.control}
                        name='title'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('titleLabel')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('titlePlaceholder')}
                                        autoComplete='off'
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('descriptionLabel')}</FormLabel>
                                <FormControl>
                                    <textarea
                                        className='min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                        placeholder={t('descriptionPlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className='grid gap-4 sm:grid-cols-2'>
                        <FormField
                            control={form.control}
                            name='category'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('categoryLabel')}</FormLabel>
                                    <FormControl>
                                        <select
                                            className='h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                            {...field}
                                        >
                                            {GOAL_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {categoryLabels[cat]}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='priority'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('priorityLabel')}</FormLabel>
                                    <FormControl>
                                        <select
                                            className='h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                            value={field.value ?? ''}
                                            onChange={event =>
                                                field.onChange(
                                                    event.target.value
                                                        ? event.target.value
                                                        : undefined
                                                )
                                            }
                                        >
                                            <option value=''>{t('priorityDefault')}</option>
                                            {GOAL_PRIORITIES.map(p => (
                                                <option key={p} value={p}>
                                                    {priorityLabels[p]}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className='grid gap-4 sm:grid-cols-2'>
                        <FormField
                            control={form.control}
                            name='deadline'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('deadlineLabel')}</FormLabel>
                                    <FormControl>
                                        <DateTimeInput minDate={minDeadlineDate} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='estimatedHours'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('estimatedHoursLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='number'
                                            step='0.5'
                                            min='0.5'
                                            placeholder={t('estimatedHoursPlaceholder')}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {submitError ? <p className='text-sm text-destructive'>{submitError}</p> : null}

                    <div className='flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end'>
                        <Button type='button' variant='secondary' onClick={handleCancel}>
                            {t('cancelButton')}
                        </Button>
                        <Button type='submit' disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting
                                ? mode === 'edit'
                                    ? t('savingButton')
                                    : t('creatingButton')
                                : mode === 'edit'
                                  ? t('saveButton')
                                  : t('createButton')}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
