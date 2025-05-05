// pptxExport.js - Handles exporting slides to PPTX format
// Note: This requires the PptxGenJS library to be included in the project

// This is a placeholder for future implementation
// To make this work, you'll need to include the PptxGenJS library:
// <script src="https://cdn.jsdelivr.net/npm/pptxgenjs/dist/pptxgen.min.js"></script>

// Function to export the current slide to PPTX
function exportToPPTX(layoutType, content, template) {
    // Check if PptxGenJS is available
    if (typeof pptxgen === 'undefined') {
        console.error('PptxGenJS library not loaded');
        alert('Export functionality requires the PptxGenJS library which is not loaded.');
        return;
    }
    
    try {
        // Create a new presentation
        let pres = new pptxgen();
        
        // Set the template colors
        pres.layout = 'LAYOUT_16x9';
        
        // Add a new slide
        let slide = pres.addSlide();
        
        // Apply the template background color
        slide.background = { color: template.colors.background };
        
        // Based on the layout type, add content to the slide
        switch (layoutType) {
            case 'titleAndBullets':
                slide.addText(content.title, {
                    x: 0.5,
                    y: 0.5,
                    w: '90%',
                    color: template.colors.primary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 24,
                    bold: true
                });
                
                slide.addText(content.bullets.map(bullet => `• ${bullet}`).join('\n'), {
                    x: 0.5,
                    y: 1.5,
                    w: '90%',
                    color: template.colors.text,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 18
                });
                break;
                
            case 'quote':
                slide.addText(`"${content.quote}"`, {
                    x: 0.5,
                    y: 2,
                    w: '90%',
                    h: 3,
                    align: 'center',
                    color: template.colors.primary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 24,
                    italic: true
                });
                
                slide.addText(`— ${content.author}`, {
                    x: 5,
                    y: 5,
                    w: '40%',
                    align: 'right',
                    color: template.colors.secondary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 16
                });
                break;
                
            case 'imageAndParagraph':
                slide.addText(content.title, {
                    x: 0.5,
                    y: 0.5,
                    w: '90%',
                    color: template.colors.primary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 24,
                    bold: true
                });
                
                slide.addText(content.paragraph, {
                    x: 0.5,
                    y: 1.5,
                    w: '45%',
                    color: template.colors.text,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 16
                });
                
                // Add a placeholder rectangle for the image
                slide.addShape(pres.ShapeType.rect, {
                    x: 5.5,
                    y: 1.5,
                    w: 4,
                    h: 3,
                    fill: { color: template.colors.secondary },
                    line: { color: template.colors.primary }
                });
                
                slide.addText(content.imageDescription, {
                    x: 5.5,
                    y: 2.5,
                    w: 4,
                    align: 'center',
                    color: template.colors.background,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 14
                });
                break;
                
            case 'twoColumn':
                slide.addText(content.title, {
                    x: 0.5,
                    y: 0.5,
                    w: '90%',
                    color: template.colors.primary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 24,
                    bold: true
                });
                
                slide.addText(content.column1Title, {
                    x: 0.5,
                    y: 1.5,
                    w: '45%',
                    color: template.colors.secondary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 20,
                    bold: true
                });
                
                slide.addText(content.column1Content, {
                    x: 0.5,
                    y: 2.2,
                    w: '45%',
                    color: template.colors.text,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 16
                });
                
                slide.addText(content.column2Title, {
                    x: 5.5,
                    y: 1.5,
                    w: '45%',
                    color: template.colors.secondary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 20,
                    bold: true
                });
                
                slide.addText(content.column2Content, {
                    x: 5.5,
                    y: 2.2,
                    w: '45%',
                    color: template.colors.text,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 16
                });
                break;
                
            case 'titleOnly':
                slide.addText(content.title, {
                    x: 0.5,
                    y: 2,
                    w: '90%',
                    align: 'center',
                    color: template.colors.primary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 36,
                    bold: true
                });
                
                slide.addText(content.subtitle, {
                    x: 0.5,
                    y: 3.5,
                    w: '90%',
                    align: 'center',
                    color: template.colors.secondary,
                    fontFace: template.fontFamily.split(',')[0].trim(),
                    fontSize: 24
                });
                break;
                
            default:
                console.error('Unknown layout type:', layoutType);
                return;
        }
        
        // Save the presentation
        pres.writeFile({ fileName: `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.pptx` });
        
    } catch (error) {
        console.error('Error exporting to PPTX:', error);
        alert('There was an error exporting to PPTX. See console for details.');
    }
}

// Make functions available globally
window.exportToPPTX = exportToPPTX;