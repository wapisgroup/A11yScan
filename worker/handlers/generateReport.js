/**
 * handleGenerateReport
 * --------------------
 * Generates a PDF accessibility report from scan results.
 *
 * Behavior:
 * - Fetches scan results for all pages in run.pagesIds
 * - Groups violations by type and code snippet
 * - Generates a professional multi-page PDF report
 * - Uploads PDF to Cloud Storage
 * - Updates run and job documents with reportFileURL
 * - Sends email notification to the user with secure download link
 */

const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Initialize Storage client based on emulator mode
let storage = null;
if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
    const apiEndpoint = `http://${host}`;
    storage = new Storage({
        apiEndpoint,
        projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
    });
    console.log('[Storage] Using emulator at', apiEndpoint);
} else {
    storage = new Storage();
    console.log('[Storage] Using production GCS');
}

/**
 * Group violations by impact level and rule ID
 */
function groupViolations(allScans) {
    const grouped = {
        critical: {},
        serious: {},
        moderate: {},
        minor: {}
    };

    allScans.forEach(scan => {
        const pageUrl = scan.pageUrl;
        (scan.issues || []).forEach(issue => {
            const impact = issue.impact || 'moderate';
            const message = issue.message || 'Unknown issue';
            const ruleId = issue.ruleId || 'unknown';
            const selector = issue.selector || '';
            const helpUrl = issue.helpUrl || '';
            const description = issue.description || '';

            // Create a key based on ruleId and message
            const key = `${ruleId}|||${message}`;

            if (!grouped[impact][key]) {
                grouped[impact][key] = {
                    ruleId,
                    message,
                    description,
                    helpUrl,
                    selector,
                    pages: []
                };
            }

            if (!grouped[impact][key].pages.includes(pageUrl)) {
                grouped[impact][key].pages.push(pageUrl);
            }
        });
    });

    return grouped;
}

/**
 * Generate PDF report
 */
async function generatePDF(projectData, runData, groupedViolations, reportTitle) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                info: {
                    Title: reportTitle,
                    Author: 'A11yScan',
                    Subject: 'Accessibility Report',
                    Keywords: 'accessibility, WCAG, report'
                }
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            let pageNumber = 1;

            // Helper function to add header
            function addHeader() {
                // Try to add logo if available
                const logoPath = path.join(__dirname, '../../public/web-logo-02.svg');
                const fs = require('fs');
                
                // For now, just use text branding
                doc.fontSize(12)
                   .fillColor('#649DAD')
                   .text('A11yScan', 50, 20, { align: 'left' })
                   .fillColor('#333333');
            }

            // Helper function to add footer with page number
            function addFooter() {
                doc.fontSize(9)
                   .fillColor('#666666')
                   .text(
                       `Page ${pageNumber}`,
                       50,
                       doc.page.height - 40,
                       { align: 'center', width: doc.page.width - 100 }
                   );
                pageNumber++;
            }

            // Add header
            addHeader();

            // Title page
            doc.fontSize(28)
               .fillColor('#0F172A')
               .text('Accessibility Report', 50, 100, { align: 'center' });

            doc.fontSize(16)
               .fillColor('#475569')
               .text(reportTitle, 50, 150, { align: 'center' });

            doc.fontSize(12)
               .fillColor('#64748B')
               .text(projectData.domain || 'Project', 50, 200, { align: 'center' });

            doc.fontSize(10)
               .fillColor('#94A3B8')
               .text(
                   `Generated on ${new Date().toLocaleDateString('en-US', { 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric' 
                   })}`,
                   50,
                   230,
                   { align: 'center' }
               );

            // Add footer to title page
            addFooter();

            // Introduction page
            doc.addPage();
            addHeader();

            doc.fontSize(20)
               .fillColor('#0F172A')
               .text('About This Report', 50, 80);

            doc.fontSize(11)
               .fillColor('#475569')
               .text(
                   'This accessibility report provides a comprehensive analysis of web accessibility issues found on your website. ' +
                   'The report follows Web Content Accessibility Guidelines (WCAG) 2.1 standards and identifies barriers that may ' +
                   'prevent people with disabilities from accessing your content.',
                   50,
                   130,
                   { width: 495, align: 'left', lineGap: 4 }
               );

            doc.fontSize(16)
               .fillColor('#0F172A')
               .text('Understanding Issue Severity', 50, 230);

            const severityDefs = [
                {
                    level: 'Critical',
                    color: '#DC2626',
                    desc: 'Issues that completely block access to content or functionality for users with disabilities. These must be fixed immediately as they violate WCAG Level A requirements.'
                },
                {
                    level: 'Serious',
                    color: '#F97316',
                    desc: 'Significant barriers that make content very difficult to access. These issues may prevent users from completing important tasks and should be prioritized for fixing.'
                },
                {
                    level: 'Moderate',
                    color: '#F59E0B',
                    desc: 'Issues that cause noticeable difficulties but don\'t completely prevent access. While workarounds may exist, these should still be addressed to improve user experience.'
                },
                {
                    level: 'Minor',
                    color: '#3B82F6',
                    desc: 'Issues that cause minor inconveniences but don\'t significantly impact accessibility. These are best practices that should be implemented when possible.'
                }
            ];

            let yPos = 280;
            severityDefs.forEach(def => {
                doc.fontSize(12)
                   .fillColor(def.color)
                   .text(def.level, 50, yPos, { continued: true })
                   .fillColor('#475569')
                   .fontSize(10)
                   .text(`: ${def.desc}`, { width: 495, lineGap: 3 });
                yPos += 75;
            });

            // No footer here - will be added when we move to next page

            // Summary page
            doc.addPage();
            addHeader();

            doc.fontSize(20)
               .fillColor('#0F172A')
               .text('Executive Summary', 50, 80);

            // Calculate stats from grouped violations
            const stats = {
                critical: Object.keys(groupedViolations.critical).length,
                serious: Object.keys(groupedViolations.serious).length,
                moderate: Object.keys(groupedViolations.moderate).length,
                minor: Object.keys(groupedViolations.minor).length
            };
            const totalIssues = stats.critical + stats.serious + stats.moderate + stats.minor;

            doc.fontSize(12)
               .fillColor('#475569')
               .text(`Total Issues Found: ${totalIssues}`, 50, 130);

            yPos = 160;

            // Critical issues
            doc.fontSize(14)
               .fillColor('#DC2626')
               .text(`Critical: ${stats.critical}`, 70, yPos);
            yPos += 30;

            // Serious issues  
            doc.fontSize(14)
               .fillColor('#F97316')
               .text(`Serious: ${stats.serious}`, 70, yPos);
            yPos += 30;

            // Moderate issues
            doc.fontSize(14)
               .fillColor('#F59E0B')
               .text(`Moderate: ${stats.moderate}`, 70, yPos);
            yPos += 30;

            // Minor issues
            doc.fontSize(14)
               .fillColor('#3B82F6')
               .text(`Minor: ${stats.minor}`, 70, yPos);

            // No footer here - will be added when moving to detailed issues

            // Detailed issues by severity
            const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
            const impactColors = {
                critical: '#DC2626',
                serious: '#F97316',
                moderate: '#F59E0B',
                minor: '#3B82F6'
            };
            const impactLabels = {
                critical: 'Critical Issues',
                serious: 'Serious Issues',
                moderate: 'Moderate Issues',
                minor: 'Minor Issues'
            };

            impactOrder.forEach(impact => {
                const issues = groupedViolations[impact];
                const issueKeys = Object.keys(issues);

                if (issueKeys.length === 0) return;

                // New page for each severity level
                doc.addPage();
                addHeader();

                doc.fontSize(20)
                   .fillColor(impactColors[impact])
                   .text(impactLabels[impact], 50, 80);

                doc.fontSize(12)
                   .fillColor('#64748B')
                   .text(`${issueKeys.length} unique issue${issueKeys.length !== 1 ? 's' : ''} found`, 50, 115);

                let yPosition = 150;

                issueKeys.forEach((key, index) => {
                    const issue = issues[key];

                    // Check if we need a new page
                    if (yPosition > 650) {
                        addFooter();
                        doc.addPage();
                        addHeader();
                        yPosition = 80;
                    }

                    // Issue number and message
                    doc.fontSize(12)
                       .fillColor('#0F172A')
                       .text(`${index + 1}. ${issue.message}`, 50, yPosition, {
                           width: 495,
                           align: 'left'
                       });

                    yPosition += 25;

                    // Rule ID if available and not unknown
                    if (issue.ruleId && issue.ruleId !== 'unknown') {
                        if (yPosition > 710) {
                            addFooter();
                            doc.addPage();
                            addHeader();
                            yPosition = 80;
                        }

                        doc.fontSize(9)
                           .fillColor('#8B5CF6')
                           .text(`Rule: ${issue.ruleId}`, 70, yPosition);
                        yPosition += 18;
                    }

                    // Description
                    if (issue.description) {
                        if (yPosition > 680) {
                            addFooter();
                            doc.addPage();
                            addHeader();
                            yPosition = 80;
                        }

                        doc.fontSize(9)
                           .fillColor('#475569')
                           .text(issue.description, 70, yPosition, {
                               width: 475,
                               lineGap: 2
                           });
                        yPosition += Math.ceil(issue.description.length / 70) * 12 + 10;
                    }

                    // Help URL
                    if (issue.helpUrl) {
                        if (yPosition > 710) {
                            addFooter();
                            doc.addPage();
                            addHeader();
                            yPosition = 80;
                        }

                        doc.fontSize(9)
                           .fillColor('#2563EB')
                           .text('Learn more: ', 70, yPosition, { continued: true, underline: false })
                           .fillColor('#3B82F6')
                           .text(issue.helpUrl, { link: issue.helpUrl, underline: true });
                        yPosition += 20;
                    }

                    // Code snippet if available
                    if (issue.selector && issue.selector.trim()) {
                        if (yPosition > 650) {
                            addFooter();
                            doc.addPage();
                            addHeader();
                            yPosition = 80;
                        }

                        doc.fontSize(9)
                           .fillColor('#64748B')
                           .text('Selector:', 70, yPosition);
                        
                        yPosition += 15;

                        doc.fontSize(8)
                           .fillColor('#1E293B')
                           .font('Courier')
                           .text(issue.selector.substring(0, 200), 70, yPosition, {
                               width: 475,
                               height: 60
                           })
                           .font('Helvetica');

                        yPosition += Math.min(60, Math.ceil(issue.selector.length / 80) * 12) + 10;
                    }

                    // Affected pages
                    if (yPosition > 680) {
                        addFooter();
                        doc.addPage();
                        addHeader();
                        yPosition = 80;
                    }

                    doc.fontSize(9)
                       .fillColor('#64748B')
                       .text(`Affected pages (${issue.pages.length}):`, 70, yPosition);

                    yPosition += 15;

                    // List pages (max 5 per issue to save space)
                    const pagesToShow = issue.pages.slice(0, 5);
                    pagesToShow.forEach(pageUrl => {
                        if (yPosition > 720) {
                            addFooter();
                            doc.addPage();
                            addHeader();
                            yPosition = 80;
                        }

                        // Draw a simple bullet point using circle
                        doc.circle(95, yPosition + 4, 2)
                           .fillColor('#94A3B8')
                           .fill();

                        doc.fontSize(8)
                           .fillColor('#475569')
                           .text(pageUrl, 105, yPosition, {
                               width: 440,
                               ellipsis: true
                           });
                        yPosition += 12;
                    });

                    if (issue.pages.length > 5) {
                        doc.fontSize(8)
                           .fillColor('#94A3B8')
                           .text(`... and ${issue.pages.length - 5} more pages`, 105, yPosition);
                        yPosition += 12;
                    }

                    yPosition += 25; // Space between issues
                });

                addFooter();
            });

            // Finalize PDF
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Send email notification
 */
async function sendEmailNotification(db, userId, projectData, reportTitle, downloadUrl) {
    try {
        // Create a mail document in Firestore for a mail extension to process
        // This is a common pattern with Firebase extensions like "Trigger Email"
        await db.collection('mail').add({
            to: [userId], // Assumes userId is email, or you need to look up user email
            message: {
                subject: `Accessibility Report Ready: ${reportTitle}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #649DAD;">Your Accessibility Report is Ready</h2>
                        <p>Hello,</p>
                        <p>Your accessibility report "<strong>${reportTitle}</strong>" for <strong>${projectData.domain || 'your project'}</strong> has been generated successfully.</p>
                        <p style="margin: 30px 0;">
                            <a href="${downloadUrl}" 
                               style="background-color: #649DAD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Download Report
                            </a>
                        </p>
                        <p style="color: #666; font-size: 12px;">This link is unique to your report and will expire in 7 days.</p>
                        <p style="color: #666; font-size: 12px;">If you did not request this report, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 11px;">A11yScan - Accessibility Testing Platform</p>
                    </div>
                `
            }
        });

        console.log('Email notification queued for:', userId);
    } catch (err) {
        console.error('Failed to send email notification:', err);
        // Don't throw - email failure shouldn't fail the job
    }
}

async function handleGenerateReport(db, projectId, runId) {
    console.log('handleGenerateReport', projectId, runId);

    const projectRef = db.collection('projects').doc(projectId);
    const projSnap = await projectRef.get();
    if (!projSnap.exists) {
        throw new Error('Project not found: ' + projectId);
    }
    const projectData = projSnap.data();

    // Update run status -> running
    const runRef = projectRef.collection('runs').doc(runId);
    await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Get run doc data
    const runSnap = await runRef.get();
    if (!runSnap.exists) {
        throw new Error('Run not found: ' + runId);
    }
    const runData = runSnap.data() || {};
    const pagesIds = Array.isArray(runData.pagesIds) ? runData.pagesIds : [];
    const reportTitle = runData.meta?.title || runData.reportTitle || 'Accessibility Report';
    const creatorId = runData.creatorId || 'system';

    if (pagesIds.length === 0) {
        throw new Error('No pages specified for report generation');
    }

    console.log(`Generating report for ${pagesIds.length} pages...`);

    // Fetch all scan results for the specified pages
    const scansCol = projectRef.collection('scans');
    const allScans = [];

    for (const pageId of pagesIds) {
        const scanQuery = await scansCol
            .where('pageId', '==', pageId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!scanQuery.empty) {
            const scanDoc = scanQuery.docs[0];
            allScans.push({
                pageId,
                pageUrl: scanDoc.data().pageUrl,
                issues: scanDoc.data().issues || [],
                summary: scanDoc.data().summary || {}
            });
        }
    }

    if (allScans.length === 0) {
        throw new Error('No scan results found for the specified pages');
    }

    console.log(`Found scan results for ${allScans.length} pages`);

    // Group violations by type and code
    const groupedViolations = groupViolations(allScans);

    // Calculate stats from grouped violations
    const calculatedStats = {
        critical: Object.keys(groupedViolations.critical).length,
        serious: Object.keys(groupedViolations.serious).length,
        moderate: Object.keys(groupedViolations.moderate).length,
        minor: Object.keys(groupedViolations.minor).length
    };

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await generatePDF(projectData, runData, groupedViolations, reportTitle);

    // Upload PDF to storage
    const defaultBucketName = admin.app().options?.storageBucket || process.env.STORAGE_BUCKET;
    if (!defaultBucketName) {
        throw new Error('No storage bucket configured');
    }

    const bucket = storage.bucket(defaultBucketName);
    
    // Create unique filename with hash to prevent guessing
    const fileHash = crypto.randomBytes(16).toString('hex');
    const fileName = `${projectId}_${runId}_${fileHash}.pdf`;
    const filePath = `projects/${projectId}/reports/${fileName}`;
    
    const file = bucket.file(filePath);
    await file.save(pdfBuffer, {
        contentType: 'application/pdf',
        metadata: {
            contentDisposition: `attachment; filename="${reportTitle}.pdf"`,
            cacheControl: 'private, max-age=0',
            metadata: {
                projectId,
                runId,
                generatedAt: new Date().toISOString()
            }
        }
    });

    console.log('PDF uploaded to storage:', filePath);

    // Generate download URL
    let downloadUrl;
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
        downloadUrl = `http://${emulatorHost}/v0/b/${defaultBucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
    } else {
        // Production: generate signed URL valid for 7 days
        [downloadUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
        });
    }

    // Update run document
    await runRef.update({
        status: 'done',
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        reportFileURL: downloadUrl,
        reportFilePath: filePath,
        pagesScanned: allScans.length
    });

    console.log('Run document updated with report URL');

    // Create report document in projects/{projectId}/reports collection
    const reportsCol = projectRef.collection('reports');
    const reportDoc = await reportsCol.add({
        title: reportTitle,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        runId: runId,
        pdfUrl: downloadUrl,
        filePath: filePath,
        type: runData.reportType || 'full',
        pageSetId: runData.pageSetId || null,
        pageCount: allScans.length,
        status: 'completed',
        createdBy: creatorId,
        stats: calculatedStats
    });

    console.log('Report document created:', reportDoc.id);

    // Send email notification
    await sendEmailNotification(db, creatorId, projectData, reportTitle, downloadUrl);

    console.log('Report generation completed successfully');
    return { ok: true, reportUrl: downloadUrl, pagesScanned: allScans.length, reportId: reportDoc.id };
}

module.exports = { handleGenerateReport };
