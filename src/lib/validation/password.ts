import { z } from "zod";

// At least 8 chars, one digit, one special char
export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/.*\d.*/, "Password must include at least one number")
  .regex(/.*[^\w\s].*/, "Password must include at least one special character");
