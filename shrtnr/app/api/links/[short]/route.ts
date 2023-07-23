import { NextResponse } from 'next/server'
import { Redis } from 'ioredis'
import { Analytics } from '@/lib/analytics'
import { ShortUrlUrn } from '@/lib/urns'
import { LinkShortener } from '@/lib/link-shortener'
import { ShortUrlNotFoundError } from '@/lib/errors'
import { LinksHandler } from '@/lib/handlers/links'

const redis = new Redis()
const analytics = new Analytics(redis)
const shortener = new LinkShortener(redis)
const handler = new LinksHandler(analytics, shortener)

/**
 * @swagger
 * /api/links/{short}:
 *   get:
 *     summary: Endpoint to get information about a short link
 *     parameters:
 *       - in: path
 *         name: short
 *         schema:
 *           type: string
 *         required: true
 *         description: Short link to get information about
 *     responses:
 *       200:
 *         description: Successful response for short link information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL of the resulting short link
 *                 timeseries:
 *                   type: array
 *                   description: Timeseries for short link clicks
 *                   items:
 *                     type: array
 *                     items:
 *                       type: number
 *       500:
 *         description: Server error experienced during short link creation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       404:
 *         description: Short link not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *   delete:
 *     summary: Endpoint to delete a short link
 *     parameters:
 *       - in: path
 *         name: short
 *         schema:
 *           type: string
 *         required: true
 *         description: Short link to delete
 *     responses:
 *       200:
 *         description: Successful response for short link deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message indicating the short link was successfully deleted
 *       500:
 *         description: Server error experienced during short link deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       404:
 *         description: Attempting to delete a short link that could not be found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
export async function GET(request: Request, { params }: { params: { short: string }}) {
    const { short } = params
    const shortUrlUrn = new ShortUrlUrn(short)
    const url = new URL(request.url)
    const start = Number.parseInt(url.searchParams.get('start') || '0')
    const end = Number.parseInt(url.searchParams.get('end') || new Date().getTime().toString())
    const result = await handler.get(shortUrlUrn, start, end)

    if (result.err) {

        if (result.val instanceof ShortUrlNotFoundError || result.val.message.includes('ERR TSDB: the key does not exist')) {
            return NextResponse.json({ error: `Link "${short}" not found.` }, { status: 404 })
        }
        return NextResponse.json({ error: result.val.message }, { status: 500 })
    }
    return NextResponse.json(result.val, { status: 200 })
}

export async function DELETE(_: Request, { params }: { params: { short: string }}) {
    const { short } = params
    const shortUrlUrn = new ShortUrlUrn(short)
    let result = await handler.delete(shortUrlUrn)

    if (result.err) {

        if (result.val instanceof ShortUrlNotFoundError) {
            return NextResponse.json({ error: result.val.message }, { status: 404 })
        }
        return NextResponse.json({ error: result.val.message }, { status: 500 })
    }
    return NextResponse.json({ message: `Link "${short}" successfully deleted` }, { status: 200 })
}

export const runtime = 'nodejs'