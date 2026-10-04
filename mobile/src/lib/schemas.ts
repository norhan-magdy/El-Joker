import { z } from "zod";

import {
  CART_ITEM_MAX_QTY,
  CHECKOUT_ADDRESS_MAX,
  CHECKOUT_ADDRESS_MIN,
} from "@/lib/config";

/**
 * Client-side schemas.
 *
 * These mirror the Laravel validation rules so the common failures are caught
 * without a round trip. They are a convenience, never the authority: every
 * screen also maps the server's 422 payload onto the form, because a stale
 * client rule must not be able to reject a request the API would have accepted.
 */

const email = z
  .email("Enter a valid email address.")
  .max(255, "Email is too long.");

const password = z
  .string()
  .min(1, "Enter your password.");

export const loginSchema = z.object({
  email,
  password,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const adminLoginSchema = loginSchema;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Enter your name.")
      .max(255, "Name is too long."),
    email,
    // Matches `Password::min(8)` on the backend, which is the only rule applied.
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(255, "Password is too long."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const checkoutSchema = z.object({
  shipping_address: z
    .string()
    .min(
      CHECKOUT_ADDRESS_MIN,
      `Enter at least ${CHECKOUT_ADDRESS_MIN} characters.`
    )
    .max(
      CHECKOUT_ADDRESS_MAX,
      `Keep this under ${CHECKOUT_ADDRESS_MAX} characters.`
    ),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const quantitySchema = z
  .number({ error: "Enter a quantity." })
  .int("Use a whole number.")
  .min(1, "Minimum quantity is 1.")
  .max(CART_ITEM_MAX_QTY, `Maximum quantity is ${CART_ITEM_MAX_QTY}.`);

/**
 * Admin product form.
 *
 * `image_url` is required by the backend and there is no upload endpoint, so
 * admins paste a URL on mobile. `price` is capped at the server's numeric
 * ceiling to fail early instead of receiving a 422 for an overflow.
 */
/**
 * Admin product form values.
 *
 * Every value is a string because that is what a React Native `TextInput`
 * actually holds. Validating the string and converting in the submit handler
 * keeps the types honest — `z.coerce.number()` would make Zod's *input* type
 * `unknown`, which cannot satisfy react-hook-form's resolver generics.
 */
export const productFormSchema = z.object({
  title: z.string().min(1, "Enter a title.").max(255, "Title is too long."),
  category_id: z
    .string()
    .min(1, "Choose a category.")
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      "Choose a category."
    ),
  price: z
    .string()
    .min(1, "Enter a price.")
    .refine((value) => Number.isFinite(Number(value)), "Enter a valid number.")
    .refine((value) => Number(value) >= 0, "Price cannot be negative.")
    .refine(
      (value) => Number(value) <= 9999999999.99,
      "Price is above the allowed maximum."
    ),
  image_url: z
    .string()
    .min(1, "Enter an image URL.")
    .url("Enter a valid URL, including https://"),
  description: z.string().max(5000, "Description is too long."),
  // Empty is allowed: `stock` is `sometimes` on both `StoreProductRequest` and
  // `UpdateProductRequest`, and ProductService treats a missing value as "leave
  // the inventory alone" on update and as 0 on create. Requiring it here made an
  // edit unsaveable whenever the payload came back without a loaded inventory.
  // `superRefine` rather than a single `refine` because a blank value has to
  // pass outright while each failure keeps its own specific message.
  stock: z.string().superRefine((value, ctx) => {
    if (value.trim() === "") return;
    const quantity = Number(value);
    if (!Number.isInteger(quantity)) {
      ctx.addIssue({ code: "custom", message: "Use a whole number." });
    } else if (quantity < 0) {
      ctx.addIssue({ code: "custom", message: "Stock cannot be negative." });
    }
  }),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Enter a name.").max(255, "Name is too long."),
  /** An empty string means "top level" and becomes `null` on submit. */
  parent_id: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        (Number.isInteger(Number(value)) && Number(value) > 0),
      "Choose a parent category."
    ),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
