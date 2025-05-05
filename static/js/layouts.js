// layouts.js - Defines the slide layouts and rendering functions with improved text formatting

// Helper function to safely extract text from column content that might be objects or strings
function extractContentText(contentItem) {
    if (typeof contentItem === 'string') {
        return contentItem;
    } else if (contentItem === null || contentItem === undefined) {
        return '';
    } else if (typeof contentItem === 'object') {
        // Handle different object structures
        if (contentItem.text) {
            return contentItem.text;
        } else if (contentItem.bulletPoint) {
            return contentItem.bulletPoint;
        } else {
            // Try to get a string representation that isn't "[object Object]"
            try {
                const keys = Object.keys(contentItem);
                if (keys.length > 0) {
                    return contentItem[keys[0]] || '';
                }
                return '';
            } catch (e) {
                return '';
            }
        }
    } else {
        return String(contentItem);
    }
}

// Helper function to process array content (for columns and bullets)
function processArrayContent(contentArray) {
    if (!Array.isArray(contentArray)) {
        // If it's not an array but a string, return it as is
        if (typeof contentArray === 'string') {
            return contentArray;
        }
        // If it's an object, try to extract text
        if (typeof contentArray === 'object' && contentArray !== null) {
            return extractContentText(contentArray);
        }
        // Default fallback
        return '';
    }
    
    // Process each item in the array
    return contentArray.map(item => extractContentText(item)).join('</p><p>');
}

const layouts = {
    // Title and bullet points layout
 // Update this function in your layouts.js file
titleAndBullets: {
    name: 'Title and Bullets',
    render: function(content, template) {
        // Debug the incoming content
        console.log("Rendering titleAndBullets with content:", JSON.stringify(content));
        
        // Ensure bullets is always an array of strings
        let bulletPoints = [];
        
        // Check if content exists
        if (content) {
            // Handle bullets from different formats
            if (content.bullets) {
                if (Array.isArray(content.bullets)) {
                    // Handle array of objects or strings
                    bulletPoints = content.bullets.map(bullet => {
                        // If bullet is a string, use it directly
                        if (typeof bullet === 'string') {
                            return bullet;
                        }
                        // If bullet is an object, extract the text or bulletPoint property
                        else if (typeof bullet === 'object' && bullet !== null) {
                            return bullet.text || bullet.bulletPoint || JSON.stringify(bullet);
                        }
                        // Otherwise convert to string
                        return String(bullet);
                    });
                } else if (typeof content.bullets === 'string') {
                    // If bullets is a string, make it a single-item array
                    bulletPoints = [content.bullets];
                }
            }
        }
        
        // Limit to 5 bullets and truncate long ones
        bulletPoints = bulletPoints.slice(0, 5).map(bullet => {
            return bullet.length > 100 ? bullet.substring(0, 97) + '...' : bullet;
        });
        
        return `
            <div class="slide layout-titleAndBullets" style="
                background-color: ${template.colors.background}; 
                color: ${template.colors.text};
                font-family: ${template.fontFamily || template.font};
                height: 100%;
                padding: 40px;
                display: flex;
                flex-direction: column;
            ">
                <h1 class="title" style="
                    color: ${template.colors.primary};
                    font-size: 36px;
                    margin-bottom: 30px;
                    margin-top: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: normal;
                    max-height: 100px;
                ">${content && content.title ? content.title : 'Title'}</h1>
                <ul style="
                    margin: 0;
                    padding-left: 30px;
                    overflow: hidden;
                    flex-grow: 1;
                ">
                    ${bulletPoints.length > 0 ? 
                        bulletPoints.map(bullet => `
                            <li style="
                                margin-bottom: 16px;
                                font-size: 22px;
                                line-height: 1.4;
                            ">${bullet}</li>
                        `).join('') : 
                        '<li style="margin-bottom: 16px; font-size: 22px; line-height: 1.4;">No bullet points available</li>'
                    }
                </ul>
            </div>
        `;
    }
},
    
    // Quote layout
    quote: {
        name: 'Quote',
        render: function(content, template) {
            // Limit and format quote text
            const quoteText = content.quote || 'Quote goes here';
            const formattedQuote = quoteText.length > 150 ? quoteText.substring(0, 147) + '...' : quoteText;
            
            // Limit author text
            const authorText = content.author || 'Author';
            const formattedAuthor = authorText.length > 50 ? authorText.substring(0, 47) + '...' : authorText;
            
            return `
                <div class="slide layout-quote" style="
                    background-color: ${template.colors.background}; 
                    color: ${template.colors.text};
                    font-family: ${template.fontFamily || template.font};
                    height: 100%;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                ">
                    <div class="quote" style="
                        color: ${template.colors.primary};
                        font-size: 28px;
                        line-height: 1.5;
                        text-align: center;
                        max-width: 80%;
                        margin: 0 auto 30px;
                        font-style: italic;
                    ">
                        "${formattedQuote}"
                    </div>
                    <div class="author" style="
                        color: ${template.colors.secondary};
                        font-size: 20px;
                        text-align: right;
                        margin-right: 80px;
                        margin-top: 20px;
                    ">
                        — ${formattedAuthor}
                    </div>
                </div>
            `;
        }
    },
    
    // Image and paragraph layout
    imageAndParagraph: {
        name: 'Image and Paragraph',
        render: function(content, template) {
            // Format paragraph text with overflow protection
            const paragraphText = content.paragraph || 'Paragraph text';
            const formattedParagraph = paragraphText.length > 300 ? paragraphText.substring(0, 297) + '...' : paragraphText;
            
            // Format image description
            const imgDesc = content.imageDescription || 'Image description';
            const formattedImgDesc = imgDesc.length > 100 ? imgDesc.substring(0, 97) + '...' : imgDesc;
            
            // Generate an image prompt based on the description
            const imagePrompt = `Generate an image of: ${formattedImgDesc}`;
            
            return `
                <div class="slide layout-imageAndParagraph" style="
                    background-color: ${template.colors.background}; 
                    color: ${template.colors.text};
                    font-family: ${template.fontFamily || template.font};
                    height: 100%;
                    padding: 40px;
                ">
                    <h1 style="
                        color: ${template.colors.primary};
                        margin-bottom: 30px;
                        font-size: 36px;
                        grid-column: span 2;
                        margin-top: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: normal;
                        max-height: 80px;
                    ">${content.title || 'Title'}</h1>
                    
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        height: calc(100% - 80px);
                    ">
                        <div style="
                            overflow: auto;
                            padding-right: 10px;
                        ">
                            <p style="
                                margin: 0;
                                line-height: 1.6;
                                font-size: 20px;
                            ">${formattedParagraph}</p>
                        </div>
                        
                        <div class="image-placeholder" style="
                            background-color: ${template.colors.secondary};
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            border-radius: 4px;
                            position: relative;
                            border: 2px dashed ${template.colors.primary};
                        ">
                            <div style="
                                text-align: center;
                                padding: 20px;
                                color: ${template.colors.background};
                                max-width: 80%;
                                font-size: 18px;
                            ">
                                ${formattedImgDesc}
                            </div>
                            <div style="
                                position: absolute;
                                bottom: 10px;
                                background-color: ${template.colors.primary};
                                color: ${template.colors.background};
                                padding: 8px 12px;
                                border-radius: 4px;
                                font-size: 14px;
                                margin-top: 15px;
                            ">
                                Image Prompt: ${imagePrompt}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    
    // Two column layout with improved handling of complex data structures
   // Two column layout with improved handling for different content types
// Two column layout with comprehensive handling for all data structures
twoColumn: {
    name: 'Two Columns',
    render: function(content, template) {
        console.log("Two column content:", JSON.stringify(content));
        
        // Function to process various content formats
        function processContent(item) {
            // If it's a string, return it directly
            if (typeof item === 'string') {
                return item;
            }
            
            // If it's an object with info property (as in your second example)
            if (item && typeof item === 'object' && item.info) {
                return item.info;
            }
            
            // If it's an object with text or bulletPoint
            if (item && typeof item === 'object') {
                if (item.text) return item.text;
                if (item.bulletPoint) return item.bulletPoint;
            }
            
            // Fallback: try to convert to string
            try {
                return JSON.stringify(item);
            } catch (e) {
                return '';
            }
        }
        
        // Function to render column content with various formats
        function renderColumnContent(columnData) {
            // If it's undefined or null
            if (!columnData) {
                return '<p style="margin-bottom: 12px; line-height: 1.6; font-size: 18px;">No content available</p>';
            }
            
            // If it's a string
            if (typeof columnData === 'string') {
                return `<p style="margin-bottom: 12px; line-height: 1.6; font-size: 18px;">${columnData}</p>`;
            }
            
            // If it's an array
            if (Array.isArray(columnData)) {
                return columnData.map(item => {
                    const processedContent = processContent(item);
                    return `<p style="margin-bottom: 12px; line-height: 1.6; font-size: 18px;">${processedContent}</p>`;
                }).join('');
            }
            
            // If it's an object but not an array
            if (typeof columnData === 'object') {
                const processedContent = processContent(columnData);
                return `<p style="margin-bottom: 12px; line-height: 1.6; font-size: 18px;">${processedContent}</p>`;
            }
            
            // Final fallback
            return '<p style="margin-bottom: 12px; line-height: 1.6; font-size: 18px;">Content unavailable</p>';
        }
        
        return `
            <div class="slide layout-twoColumn" style="
                background-color: ${template.colors.background}; 
                color: ${template.colors.text};
                font-family: ${template.fontFamily || template.font};
                height: 100%;
                padding: 40px;
            ">
                <h1 style="
                    color: ${template.colors.primary};
                    margin-bottom: 30px;
                    font-size: 36px;
                    margin-top: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: normal;
                    max-height: 80px;
                ">${content.title || 'Title'}</h1>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    height: calc(100% - 80px);
                ">
                    <div class="column">
                        <h2 style="
                            color: ${template.colors.secondary};
                            margin-bottom: 15px;
                            font-size: 24px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        ">${content.column1Title || 'Column 1'}</h2>
                        <div style="
                            height: calc(100% - 45px);
                            overflow: auto;
                            padding-right: 10px;
                        ">${renderColumnContent(content.column1Content)}</div>
                    </div>
                    
                    <div class="column">
                        <h2 style="
                            color: ${template.colors.secondary};
                            margin-bottom: 15px;
                            font-size: 24px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        ">${content.column2Title || 'Column 2'}</h2>
                        <div style="
                            height: calc(100% - 45px);
                            overflow: auto;
                            padding-right: 10px;
                        ">${renderColumnContent(content.column2Content)}</div>
                    </div>
                </div>
            </div>
        `;
    }
},
    
    // Title only layout
    titleOnly: {
        name: 'Title Only',
        render: function(content, template) {
            // Format title and subtitle with overflow protection
            const titleText = content.title || 'Title';
            const subtitleText = content.subtitle || 'Subtitle';
            
            const formattedTitle = titleText.length > 80 ? titleText.substring(0, 77) + '...' : titleText;
            const formattedSubtitle = subtitleText.length > 120 ? subtitleText.substring(0, 117) + '...' : subtitleText;
            
            return `
                <div class="slide layout-titleOnly" style="
                    background-color: ${template.colors.background}; 
                    color: ${template.colors.text};
                    font-family: ${template.fontFamily || template.font};
                    height: 100%;
                    padding: 60px 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                ">
                    <h1 class="title" style="
                        color: ${template.colors.primary};
                        font-size: 48px;
                        margin-bottom: 30px;
                        max-width: 80%;
                        line-height: 1.2;
                    ">${formattedTitle}</h1>
                    <h2 class="subtitle" style="
                        color: ${template.colors.secondary};
                        font-size: 30px;
                        font-weight: normal;
                        max-width: 70%;
                        line-height: 1.4;
                    ">${formattedSubtitle}</h2>
                </div>
            `;
        }
    }
};

// Function to get a layout by ID
function getLayoutById(layoutId) {
    return layouts[layoutId];
}

// Make functions available globally
window.getLayoutById = getLayoutById;