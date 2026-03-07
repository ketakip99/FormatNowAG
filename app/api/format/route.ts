import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { processDocument } from '@/lib/processor';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const paper = formData.get('paper') as File;
        const template = formData.get('template') as File;

        if (!paper || !template || paper.size === 0 || template.size === 0) {
            return NextResponse.json(
                { error: 'Please upload both a research paper and a valid template.' },
                { status: 400 }
            );
        }

        // Robust Validation
        const allowedPaperExts = ['.md', '.docx', '.txt', '.zip'];
        const allowedTemplateExts = ['.tex', '.cls', '.dotx'];

        const paperExt = path.extname(paper.name).toLowerCase();
        const templateExt = path.extname(template.name).toLowerCase();

        if (!allowedPaperExts.includes(paperExt)) {
            return NextResponse.json({ error: `Unsupported paper format (${paperExt}). Please use .md, .docx, or .txt` }, { status: 400 });
        }

        if (!allowedTemplateExts.includes(templateExt)) {
            return NextResponse.json({ error: `Unsupported template format (${templateExt}). Please use .tex, .cls, or .dotx` }, { status: 400 });
        }

        const FIVE_MB = 5 * 1024 * 1024;
        if (paper.size > FIVE_MB || template.size > FIVE_MB) {
            return NextResponse.json({ error: 'File size exceeds the 5MB limit.' }, { status: 400 });
        }

        const tmpDir = os.tmpdir();
        const uploadsDir = path.join(tmpDir, 'formatnow-uploads');
        const outputsDir = path.join(tmpDir, 'formatnow-outputs');

        // Ensure directories exist
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.mkdir(outputsDir, { recursive: true });

        const paperPath = path.join(uploadsDir, paper.name);
        const templatePath = path.join(uploadsDir, template.name);

        // Save uploaded files to disk
        const paperBuffer = Buffer.from(await paper.arrayBuffer());
        const templateBuffer = Buffer.from(await template.arrayBuffer());
        await fs.writeFile(paperPath, paperBuffer);
        await fs.writeFile(templatePath, templateBuffer);

        let finalPaperPath = paperPath;
        if (paperExt === '.zip') {
            const extractDir = path.join(uploadsDir, `${path.parse(paper.name).name}_extracted`);
            await fs.mkdir(extractDir, { recursive: true });
            const zip = new AdmZip(paperPath);
            zip.extractAllTo(extractDir, true);

            // Look for the main document in the ZIP
            const files = await fs.readdir(extractDir);
            const mainDoc = files.find(f => ['.md', '.tex', '.txt'].includes(path.extname(f).toLowerCase()));
            if (!mainDoc) {
                return NextResponse.json({ error: 'No main document (.md, .tex, .txt) found in ZIP archive.' }, { status: 400 });
            }
            finalPaperPath = path.join(extractDir, mainDoc);
        }

        const outputFilename = `${path.parse(paper.name).name}_formatted.pdf`;
        const outputPath = path.join(outputsDir, outputFilename);

        console.log(`Processing paper: ${paper.name} with template: ${template.name}`);

        const result = await processDocument(finalPaperPath, templatePath, outputPath);

        return NextResponse.json({
            success: true,
            message: 'Formatting successful',
            downloadUrl: `/api/download?file=${path.basename(result.texPath)}`
        });
    } catch (error: any) {
        console.error('Error formatting paper:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
