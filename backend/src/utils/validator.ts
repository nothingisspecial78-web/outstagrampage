import { z } from 'zod';

export const CreatePostcardSchema = z.object({
  place_id: z.string().min(1, 'Place ID or location name is required'),
  caption: z
    .string()
    .trim()
    .min(8, 'Caption must be at least 8 characters')
    .max(140, 'Caption cannot exceed 140 characters'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy_m: z.number().min(0).max(5000).optional().default(20),
  image_base64: z.string().min(10, 'Valid base64 image required'),
  demo_mode: z.boolean().optional().default(false),
});

export const CreateMeetupTokenSchema = z.object({
  chat_id: z.string().uuid(),
});

export const RedeemMeetupTokenSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'Meetup code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Meetup code must contain only numbers'),
});

export const CoachMessageSchema = z.object({
  action: z.enum(['chat', 'summary']),
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message cannot exceed 500 characters')
    .optional(),
});

export const QuestLogSchema = z.object({
  quest_id: z.string().uuid(),
  reflection: z
    .string()
    .trim()
    .min(8, 'Reflection must be at least 8 characters')
    .max(140, 'Reflection cannot exceed 140 characters'),
  minutes: z
    .number()
    .int()
    .min(1, 'Minutes must be at least 1')
    .max(240, 'Minutes cannot exceed 240'),
});
