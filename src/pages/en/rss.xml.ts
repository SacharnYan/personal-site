import type { APIRoute } from 'astro';
import { buildWritingFeed, xmlResponse } from '../../utils/feeds';

export const GET: APIRoute = async () => xmlResponse(await buildWritingFeed('en'));
