import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .refine((v) => v.endsWith("@stu.cu.edu.ng"), {
      message: "Only @stu.cu.edu.ng email addresses are allowed",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Base object shape — used for per-field real-time validation
export const signUpBaseSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .email("Please enter a valid email")
    .refine((v) => v.endsWith("@stu.cu.edu.ng"), {
      message: "Only @stu.cu.edu.ng email addresses are allowed",
    }),
  phone: z.string().min(10, "Enter a valid phone number"),
  matricNumber: z.string().min(10, "Enter a valid matric number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
});

// Full schema with cross-field refinement for form submission
export const signUpSchema = signUpBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
