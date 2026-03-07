import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execPromise = promisify(exec);

// Path to the bundled pandoc binary (Linux x64)
const BUNDLED_PANDOC_PATH = path.join(process.cwd(), 'bin', 'pandoc');

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getPandocCommand(): Promise<string> {
    // On Vercel (Linux), use the bundled binary. On local Mac, use system pandoc.
    if (process.platform === 'linux') {
        try {
            await fs.access(BUNDLED_PANDOC_PATH);
            return BUNDLED_PANDOC_PATH;
        } catch (e) {
            console.warn('Bundled pandoc not found, falling back to global command');
        }
    }
    return 'pandoc';
}

function findClosingBrace(content: string, startIndex: number): number {
    let depth = 0;
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

async function getHeuristicMetadata(paperPath: string) {
    try {
        const pandoc = await getPandocCommand();
        const { stdout } = await execPromise(`"${pandoc}" "${paperPath}" -t markdown --wrap=none | head -n 60`);
        const lines = stdout.split('\n').filter(l => l.trim().length > 0);

        let title = '';
        let abstract = '';
        let authors: { name: string; affiliation: string; email: string }[] = [];

        // heuristics...
        const titleLineIdx = lines.findIndex(l => l.startsWith('**Title:'));
        if (titleLineIdx !== -1) {
            let titleLines = [];
            for (let i = titleLineIdx; i < lines.length; i++) {
                titleLines.push(lines[i].replace('**Title:', '').replace(/\*\*/g, '').trim());
                if (lines[i].endsWith('**')) break;
            }
            title = titleLines.join(' ').trim();
        } else if (lines[0]?.startsWith('**')) {
            let titleLines = [];
            for (let i = 0; i < lines.length; i++) {
                titleLines.push(lines[i].replace(/\*\*/g, '').trim());
                if (lines[i].endsWith('**')) break;
            }
            title = titleLines.join(' ').trim();
        }

        const absIdx = lines.findIndex(l => l.toLowerCase().includes('**abstract**'));
        if (absIdx !== -1) {
            let absLines = [];
            for (let i = absIdx + 1; i < lines.length; i++) {
                if (lines[i].startsWith('#') || (lines[i].startsWith('**') && lines[i].length < 100)) break;
                absLines.push(lines[i]);
            }
            abstract = absLines.join(' ').trim();
        }

        if (absIdx !== -1) {
            for (let i = (titleLineIdx !== -1 ? titleLineIdx + 1 : 1); i < absIdx; i++) {
                if (lines[i].startsWith('**') && lines[i].endsWith('**') && lines[i].length < 100) {
                    let name = lines[i].replace(/\*\*/g, '').trim();
                    if (name.toLowerCase() === 'abstract' || name.toLowerCase().startsWith('title:')) continue;

                    let affiliationLines = [];
                    let email = '';
                    for (let j = i + 1; j < absIdx; j++) {
                        if (lines[j].startsWith('**')) break;
                        let rawLine = lines[j];
                        const emailMatch = rawLine.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                        if (emailMatch) {
                            email = emailMatch[0];
                            rawLine = rawLine.replace(emailMatch[0], '');
                        }
                        let aff = rawLine.replace(/\{[^}]+\}/g, '').replace(/\[+([^\]]+)\]+\([^)]+\)/g, '$1').replace(/\[+([^\]]+)\]+/g, '$1').replace(/\([^)]+\)/g, '').replace(/[\[\]()]/g, '').replace(/•/g, '').replace(/mailto:/g, '').trim();
                        if (aff) affiliationLines.push(aff);
                    }
                    authors.push({ name, affiliation: affiliationLines.join(', '), email });
                    i += affiliationLines.length;
                }
            }
        }
        return { title, abstract, authors };
    } catch (e) {
        return { title: '', abstract: '', authors: [] };
    }
}

async function prepareTemplate(templatePath: string): Promise<string> {
    let content = await fs.readFile(templatePath, 'utf-8');
    if (content.includes('$body$')) return templatePath;

    // Check if it's an IEEE template
    const isIEEE = content.includes('\\IEEEauthorblockN') || content.includes('\\IEEEoverridecommandlockouts');

    content = content.replace(/\$/g, '$$$$');

    // Dynamic Title Block
    const titleBlock = '$if(title)$$title$$else$Research Paper$endif$';
    const titleCmdIdx = content.indexOf('\\title');
    if (titleCmdIdx !== -1) {
        const openBraceIdx = content.indexOf('{', titleCmdIdx);
        const closeBraceIdx = findClosingBrace(content, openBraceIdx);
        if (closeBraceIdx !== -1) content = content.substring(0, openBraceIdx + 1) + titleBlock + content.substring(closeBraceIdx);
    }

    // Dynamic Author Block
    let authorBlock = '\n$for(author)$\n$author.name$\n$if(author.affiliation)$$author.affiliation$$endif$\n$sep$\\and \n$endfor$\n';
    if (isIEEE) {
        authorBlock = '\n$for(author)$\n\\IEEEauthorblockN{$author.name$}\n\\IEEEauthorblockA{$if(author.affiliation)$$author.affiliation$$endif$\\\\\n$if(author.email)$$author.email$$endif$}\n$sep$\\and \n$endfor$\n';
    } else {
        // Standard LaTeX author block fallback
        authorBlock = '\n$for(author)$\n$author.name$$if(author.affiliation)$\\thanks{$author.affiliation$}$endif$$sep$\\and \n$endfor$\n';
    }

    const authorCmdIdx = content.indexOf('\\author');
    if (authorCmdIdx !== -1) {
        const openBraceIdx = content.indexOf('{', authorCmdIdx);
        const closeBraceIdx = findClosingBrace(content, openBraceIdx);
        if (closeBraceIdx !== -1) content = content.substring(0, openBraceIdx + 1) + authorBlock + content.substring(closeBraceIdx);
    }

    const maketitleIndex = content.indexOf('\\maketitle');
    const endDocIndex = content.indexOf('\\end{document}');
    if (maketitleIndex !== -1) {
        const abstractSlot = '$if(abstract)$\n\\begin{abstract}\n$abstract$\n\\end{abstract}\n$endif$';
        content = content.substring(0, maketitleIndex + 10) + '\n' + abstractSlot + '\n$body$\n' + (endDocIndex !== -1 ? content.substring(endDocIndex) : '\\end{document}');
    }
    const preparedPath = templatePath + '.pandoc.tex';
    await fs.writeFile(preparedPath, content);
    return preparedPath;
}

async function postProcessTex(texPath: string, metadata: any) {
    let content = await fs.readFile(texPath, 'utf-8');

    // 1. Author Info Refinement (Only if IEEE macros are found)
    let authorIdx = content.indexOf('\\author{');
    if (authorIdx !== -1 && content.includes('\\IEEEauthorblockA')) {
        const openBraceIdx = authorIdx + 7;
        const closeBraceIdx = findClosingBrace(content, openBraceIdx);
        if (closeBraceIdx !== -1) {
            let authorBlock = content.substring(openBraceIdx + 1, closeBraceIdx);
            authorBlock = authorBlock.replace(/\\IEEEauthorblockA\{([\s\S]*?)\}/g, (match: string, affBlock: string) => {
                const parts = affBlock.split('\\\\').map(p => p.trim()).filter(p => p.length > 0);
                if (parts.length === 0) return match;

                const email = parts.find(p => p.includes('@')) || '';
                const otherParts = parts.filter(p => !p.includes('@'));

                const styledAffs = otherParts.map((a: string) => `\\textit{${a}}`).join(' \\\\\n');
                return `\\IEEEauthorblockA{${styledAffs}${email ? ' \\\\\n' + email : ''}}`;
            });
            content = content.substring(0, openBraceIdx + 1) + authorBlock + content.substring(closeBraceIdx);
        }
    }

    // 2. Remove Redundant Metadata Headers (Title, Abstract, Authors)
    if (metadata.title) {
        const escapedTitle = escapeRegExp(metadata.title);
        const titleRegex = new RegExp(`\\\\textbf\\{Title:?\\s*${escapedTitle}[^}]*\\}`, 'i');
        content = content.replace(titleRegex, '');
    }
    if (metadata.abstract) {
        content = content.replace(/\\textbf\{Abstract\}[\s\S]*?(?=\\textbf\{|\\section\{)/, '');
    }
    if (metadata.authors && metadata.authors.length > 0) {
        metadata.authors.forEach((auth: any) => {
            const escapedName = escapeRegExp(auth.name);
            const authRegex = new RegExp(`\\\\textbf\\{${escapedName}\\}[\\s\\S]*?(?=\\\\textbf\\{|\\\\section\\{|Abstract|Additional Keywords|CCS CONCEPTS)`, 'i');
            content = content.replace(authRegex, '');
        });
    }

    // 3. Image Path Sanitization & Figure Wrapping
    // Sanitize paths first
    content = content.replace(/\\includegraphics(\[[^\]]*\])?\{[^}]*\/([^}\/]+\.[a-z0-9]{3,4})\}/gi, '\\includegraphics$1{$2}');

    // Wrap in figure environments
    const imgRegex = /((?:\\includegraphics(?:\[[^\]]*\])?\{[^}]+\}(?:\s*))*)\s*(?:\\par\s*|\\n\s*)*(?:Fig(?:ure)?\s*(\d+)[\.:]\s*([^\n\r]+))/gi;
    content = content.replace(imgRegex, (match, imgs, num, caption) => {
        const cleanedImgs = imgs.trim().split(/\s+/).join('\n');
        return `\\begin{figure}[htbp]\n\\centering\n${cleanedImgs}\n\\caption{${caption.trim()}}\n\\label{fig${num}}\n\\end{figure}\n`;
    });

    // 4. Improved Table Conversion (longtable -> table/tabular)
    let tableIdx = content.indexOf('\\begin{longtable}');
    while (tableIdx !== -1) {
        let blockStart = content.lastIndexOf('\\textbf{Table', tableIdx);
        if (blockStart === -1) blockStart = content.lastIndexOf('{', tableIdx);

        const openBraceIdx = content.indexOf('{', tableIdx + 17);
        const closeBraceIdx = findClosingBrace(content, openBraceIdx);

        if (closeBraceIdx !== -1) {
            const colSpecRaw = content.substring(openBraceIdx + 1, closeBraceIdx);
            const endTableIdx = content.indexOf('\\end{longtable}', closeBraceIdx);

            if (endTableIdx !== -1) {
                const tableBody = content.substring(closeBraceIdx + 1, endTableIdx);
                const blockEnd = content.indexOf('}', endTableIdx + 15) + 1;

                let caption = 'Table';
                if (blockStart !== -1) {
                    const captionMatch = content.substring(blockStart, tableIdx).match(/\\textbf\{(Table \d+:? [^}]+)\}/);
                    if (captionMatch) caption = captionMatch[1].replace(/Table \d+:?\s*/i, '').trim();
                }

                const colCount = (colSpecRaw.match(/p\{/g) || []).length || (colSpecRaw.match(/[lrc]/g) || []).length || 3;
                const tabularSpec = '|' + Array(colCount).fill('c').join('|') + '|';

                let cleanedBody = tableBody
                    .replace(/\\begin\{minipage\}[^]*?\\raggedright/g, '')
                    .replace(/\\end\{minipage\}/g, '')
                    .replace(/\\noalign\{\}/g, '')
                    .replace(/\\endhead/g, '')
                    .replace(/\\endlastfoot/g, '')
                    .replace(/\\toprule|\\midrule|\\bottomrule/g, '\\hline')
                    .replace(/\\tabularnewline/g, '\\\\')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();

                cleanedBody = cleanedBody.replace(/(\\\\\s*&+\s*)+\\\\/g, '\\\\');
                cleanedBody = cleanedBody.replace(/(&+\s*)+\\\\/g, '');
                cleanedBody = cleanedBody.replace(/(\\hline\s*)+/g, '\\hline\n');
                cleanedBody = cleanedBody.replace(/^\\hline\s*/i, '');
                cleanedBody = cleanedBody.replace(/\\hline\s*$/i, '');

                const newTable = `\\begin{table}[htbp]\n\\centering\n\\caption{${caption}}\n\\begin{tabular}{${tabularSpec}}\n\\hline\n${cleanedBody}${cleanedBody.trim().endsWith('\\\\') ? '' : ' \\\\'}\n\\hline\n\\end{tabular}\n\\end{table}\n`;
                content = content.substring(0, blockStart) + newTable + content.substring(blockEnd);
            }
        }
        tableIdx = content.indexOf('\\begin{longtable}', tableIdx + 1);
    }

    // 5. Reference Conversion (enumerate -> thebibliography)
    const refIdx = content.indexOf('\\textbf{References}');
    if (refIdx !== -1) {
        const enumStart = content.indexOf('\\begin{enumerate}', refIdx);
        if (enumStart !== -1) {
            const enumEnd = content.indexOf('\\end{enumerate}', enumStart);
            if (enumEnd !== -1) {
                const refContent = content.substring(enumStart + 17, enumEnd);
                const items = refContent.split('\\item').map(i => i.trim()).filter(i => i.length > 0);

                // Filter out the enum definition item
                const cleanedItems = items.filter(item => !item.includes('\\def\\labelenumi')).map(item => item.trim()).filter(i => i.length > 0);

                let bibItems = cleanedItems.map((item, idx) => `\\bibitem{b${idx + 1}} ${item}`).join('\n');

                // Remove trailing punctuation/numbering at start of item if any
                bibItems = bibItems.replace(/\\bibitem\{b\d+\}\s*[\.\d]+\s*/g, (match) => match.replace(/[\.\d]+\s*$/, ''));

                const biblio = `\\begin{thebibliography}{00}\n${bibItems}\n\\end{thebibliography}`;
                content = content.substring(0, refIdx) + biblio + content.substring(enumEnd + 15);
            }
        }
    }

    // 6. Section & Subsection Cleanup
    content = content.replace(/\\textbf\{(\d+\.?\s+([A-Z community][^}]+))\}/g, (match, p1, p2) => `\\section{${p2.trim()}}`);
    content = content.replace(/\\textbf\{(\d+\.\d+\s+([A-Z][^}]+))\}/g, (match, p1, p2) => `\\subsection{${p2.trim()}}`);

    // 7. Equation Formatting
    const eqRegex = /\\\((?:(?!\\\().)*?\\\)\s*\((\d+)\)/g;
    content = content.replace(eqRegex, (match, num) => {
        const mathMatch = match.match(/\\\(([\s\S]*?)\\\)/);
        if (!mathMatch) return match;
        const cleanMath = mathMatch[1].replace(/\\ /g, ' ').replace(/\s+/g, ' ').trim();
        return `\n\\begin{equation}\n${cleanMath}\n\\label{eq${num}}\n\\end{equation}\n`;
    });

    // 8. General Whitespace Polish
    content = content.replace(/\n{3,}/g, '\n\n').trim();

    await fs.writeFile(texPath, content);
}

export async function processDocument(paperPath: string, templatePath: string, outputPath: string) {
    try {
        const paperDir = path.dirname(paperPath);
        const texOutput = outputPath.replace('.pdf', '.tex');
        const metadata = await getHeuristicMetadata(paperPath);
        let actualTemplatePath = templatePath;
        if (templatePath.endsWith('.tex')) actualTemplatePath = await prepareTemplate(templatePath);
        const metaFile = paperPath + '.meta.yaml';
        const metaContent = [
            `title: |-\n  ${metadata.title.replace(/\n/g, '\n  ')}`,
            `abstract: |-\n  ${metadata.abstract.replace(/\n/g, '\n  ')}`,
            `author:`,
            ...(metadata.authors.map(a => `  - name: "${a.name.replace(/"/g, '\\"')}"\n    affiliation: "${a.affiliation.replace(/"/g, '\\"')}"\n    email: "${a.email.replace(/"/g, '\\"')}"`))
        ].join('\n');
        await fs.writeFile(metaFile, metaContent);

        const pandoc = await getPandocCommand();
        let command = `"${pandoc}" "${paperPath}" --template="${actualTemplatePath}" --metadata-file="${metaFile}" -o "${texOutput}" --standalone --resource-path="${paperDir}" --extract-media="${paperDir}" --wrap=none`;

        console.log(`Executing Pandoc command: ${command}`);
        await execPromise(command);
        if (texOutput.endsWith('.tex')) await postProcessTex(texOutput, metadata);
        return { success: true, texPath: texOutput, format: 'latex' };
    } catch (error: any) {
        console.error('Error in processDocument:', error);
        throw new Error(`Document processing failed: ${error.message}`);
    }
}
