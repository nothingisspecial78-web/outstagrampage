import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { CreatePostcardSchema } from '../utils/validator.js';
import { PostcardService } from '../services/postcard.service.js';
import { config } from '../config.js';
import { Place } from '../types.js';

export const postcardRouter = Router();

// Lazy Supabase client with service role key if available
const supabase =
  config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)
    ? createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey)
    : null;

// Mock / in-memory places for testing or standalone execution
const DEMO_PLACES: Record<string, Place> = {
  '22222222-2222-2222-2222-222222222201': {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Riverside Artisan Cafe',
    lat: 12.9716,
    lng: 77.5946,
    radius_m: 120,
  },
  'riverside-cafe': {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Riverside Cafe',
    lat: 12.9716,
    lng: 77.5946,
    radius_m: 120,
  },
  '22222222-2222-2222-2222-222222222204': {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Demo Spot (Venue simulated)',
    lat: 0.0,
    lng: 0.0,
    radius_m: 500,
  },
};

// GET live / recent postcards
postcardRouter.get('/feed', async (_req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('postcards')
        .select('id, caption, image_path, taken_at, place_id, author_id')
        .order('taken_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return res.status(200).json({ success: true, postcards: data });
      }
    }
    return res.status(200).json({ success: true, postcards: [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

postcardRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const parseResult = CreatePostcardSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'validation_error',
        details: parseResult.error.flatten(),
      });
    }

    const payload = parseResult.data;
    const authorId =
      (req.headers['x-user-id'] as string) || '33333333-3333-3333-3333-333333333301';

    // Find place either from DEMO_PLACES or Supabase
    let place = DEMO_PLACES[payload.place_id] || DEMO_PLACES[payload.place_id.toLowerCase().replace(/[^a-z0-9]+/g, '-')];
    let realPlaceId = place?.id || '22222222-2222-2222-2222-222222222201';

    if (!place && supabase) {
      const { data } = await supabase.from('places').select('*').eq('id', payload.place_id).maybeSingle();
      if (data) {
        place = data;
        realPlaceId = data.id;
      }
    }

    if (!place) {
      place = {
        id: realPlaceId,
        name: payload.place_id,
        lat: payload.lat,
        lng: payload.lng,
        radius_m: 150,
      };
    }

    const validation = PostcardService.validatePostcardCreation(
      payload,
      place,
      false, // alreadyPostedToday
      config.allowDemoMode
    );

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        message: validation.message,
        distance_m: validation.distanceMeters,
      });
    }

    const postcardId = crypto.randomUUID();
    let imagePublicUrl = payload.image_base64;

    // Persist to Supabase if available
    if (supabase && validation.sanitizedImageBuffer) {
      try {
        const filePath = `${authorId}/${postcardId}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('postcards')
          .upload(filePath, validation.sanitizedImageBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('postcards').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            imagePublicUrl = urlData.publicUrl;
          }
        }

        // Insert into postcards table
        await supabase.from('postcards').insert({
          id: postcardId,
          author_id: authorId,
          place_id: realPlaceId,
          image_path: imagePublicUrl,
          caption: payload.caption.trim(),
          is_demo: Boolean(payload.demo_mode && config.allowDemoMode),
        });

        // Insert stamp into stamps table
        await supabase.from('stamps').insert({
          user_id: authorId,
          kind: 'place',
          label: place.name,
        });
      } catch (dbErr) {
        console.warn('[Postcard] Supabase write fallback:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      postcard_id: postcardId,
      postcard: {
        id: postcardId,
        place: place.name,
        caption: payload.caption.trim(),
        img: imagePublicUrl,
        date: 'TODAY',
      },
      message: 'Postcard validated and published! Place stamp earned.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});
