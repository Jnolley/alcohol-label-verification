import { z } from 'zod';

export const formDataSchema = z.object({
  brandName: z.string()
    .trim()
    .min(1, 'Brand name is required')
    .max(200, 'Brand name cannot exceed 200 characters'),

  productType: z.string()
    .trim()
    .min(1, 'Product type is required')
    .max(200, 'Product type cannot exceed 200 characters'),

  alcoholContent: z.custom<number>((val) => {
    if (val === undefined || val === null) {
      throw new Error('Alcohol content is required');
    }
    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error('Alcohol content must be a valid number');
    }
    return true;
  })
    .transform((val) => val as number)
    .pipe(z.number().min(0, 'Alcohol content must be between 0 and 100').max(100, 'Alcohol content must be between 0 and 100')),

  netContentsValue: z.number()
    .positive('Net contents value must be greater than 0')
    .optional(),

  netContentsUnit: z.enum(['ml', 'cl', 'L', 'fl oz', 'gal'], { message: 'Net contents unit must be one of: ml, cl, L, fl oz, gal' })
    .optional()
}).superRefine((data, ctx) => {
  // If value is provided, unit must also be provided
  if (data.netContentsValue !== undefined && !data.netContentsUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Net contents unit is required when value is provided',
      path: ['netContentsUnit']
    });
  }
  // If unit is provided, value must also be provided
  if (data.netContentsUnit && data.netContentsValue === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Net contents value is required when unit is provided',
      path: ['netContentsValue']
    });
  }
});

export type FormDataSchema = z.infer<typeof formDataSchema>;
