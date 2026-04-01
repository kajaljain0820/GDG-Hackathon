import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
    try {
        const { html } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        
        // Set viewport to a standard 16:9 presentation size
        await page.setViewport({ width: 1920, height: 1080 });
        
        await page.setContent(html, { waitUntil: ['load', 'networkidle0'] });
        
        // Generate PDF in landscape mode (16:9 like standard slides)
        // A4 landscape is not exactly 16:9, but we can customize width/height to match 16:9
        const pdfBuffer = await page.pdf({
            width: '1920px',
            height: '1080px',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });
        
        await browser.close();

        // Return PDF file
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="generated-presentation.pdf"'
            }
        });
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
    }
}
