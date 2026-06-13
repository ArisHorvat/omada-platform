import { z } from 'zod';



export const passwordSchema = z

  .string()

  .min(8, 'Password must be at least 8 characters.')

  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')

  .regex(/[0-9]/, 'Password must contain at least one number.');



export const joinAccountSchema = z

  .object({

    firstName: z.string().trim().min(1, 'First name is required.'),

    lastName: z.string().trim().min(1, 'Last name is required.'),

    email: z.string().trim().email('Enter a valid email address.'),

    password: passwordSchema,

    confirmPassword: z.string().min(1, 'Please confirm your password.'),

  })

  .refine((data) => data.password === data.confirmPassword, {

    message: 'Passwords do not match.',

    path: ['confirmPassword'],

  });



export type JoinAccountFormValues = z.infer<typeof joinAccountSchema>;



export function validatePassword(password: string): string | null {

  const result = passwordSchema.safeParse(password);

  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid password.';

}

