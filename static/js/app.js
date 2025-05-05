// app.js - Main application logic for the PowerPoint generator with editing functionality

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const topicInput = document.getElementById('topic');
    const slideCountInput = document.getElementById('slide-count');
    const generateBtn = document.getElementById('generate-btn');
    const exportBtn = document.getElementById('export-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const slidePreview = document.getElementById('slide-preview');
    const loadingIndicator = document.getElementById('loading');
    const previewSection = document.getElementById('preview-section');
    
    // Create a container for the edit button outside the slide preview
    const editButtonContainer = document.createElement('div');
    editButtonContainer.className = 'edit-controls';
    editButtonContainer.id = 'external-edit-controls';
    editButtonContainer.style.display = 'none'; // Hide initially
    
    // Insert the edit button container right after the slide preview
    slidePreview.parentNode.insertBefore(editButtonContainer, slidePreview.nextSibling);
    
    // Application state
    let currentState = {
        slides: [],
        templateId: null,
        topic: null,
        currentSlideIndex: 0,
        editMode: false
    };
    
    // Event listeners
    generateBtn.addEventListener('click', handleGenerate);
    exportBtn.addEventListener('click', handleExport);
    regenerateBtn.addEventListener('click', handleRegenerate);
    
    // Generate slides
    async function handleGenerate() {
        const topic = topicInput.value.trim();
        const templateId = window.selectedTemplateId;
        const slideCount = parseInt(slideCountInput.value, 10) || 1;
        
        // Validate input
        if (!topic) {
            alert('Please enter a presentation topic');
            return;
        }
        
        if (!templateId) {
            alert('Please select a template');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        slidePreview.innerHTML = '';
        editButtonContainer.style.display = 'none'; // Hide edit button
        
        // Disable buttons during generation
        generateBtn.disabled = true;
        exportBtn.disabled = true;
        regenerateBtn.disabled = true;
        
        try {
            // Call the backend to generate content
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    template: templateId,
                    topic: topic,
                    slideCount: slideCount
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update application state
            currentState = {
                slides: data.slides,
                templateId: templateId,
                topic: topic,
                currentSlideIndex: 0,
                editMode: false
            };
            
            // Render the first slide
            if (currentState.slides.length > 0) {
                renderCurrentSlide();
                
                // Add slide navigation if multiple slides
                if (currentState.slides.length > 1) {
                    addSlideNavigation();
                }
                
                // Show the edit button
                updateEditButton();
            } else {
                slidePreview.innerHTML = `
                    <div class="placeholder-message">
                        No slides were generated. Please try again.
                    </div>
                `;
            }
            
            // Enable buttons
            exportBtn.disabled = false;
            regenerateBtn.disabled = false;
        } catch (error) {
            console.error('Error generating slides:', error);
            alert('There was an error generating your slides. Please try again.');
            slidePreview.innerHTML = `
                <div class="placeholder-message">
                    Error: Could not generate slides. Please try again.
                </div>
            `;
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }
    
    // Update the edit button outside the slide preview
    function updateEditButton() {
        // Only show the edit button if we have slides and are not in edit mode
        if (currentState.slides.length > 0 && !currentState.editMode) {
            editButtonContainer.innerHTML = `
                <button id="edit-slide-btn" class="edit-btn">✏️ Edit Slide Content</button>
            `;
            editButtonContainer.style.display = 'block';
            
            // Add event listener to the button
            document.getElementById('edit-slide-btn').addEventListener('click', enterEditMode);
        } else {
            editButtonContainer.style.display = 'none';
        }
    }
    
    // Export to PPTX
  // Export to PPTX
async function handleExport() {
    if (!appState.slides || appState.slides.length === 0) {
        showNotification('Please generate slides first', 'error');
        return;
    }
    
    // Exit edit mode before exporting
    if (appState.editMode) {
        saveCurrentEdit();
    }
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    exportBtn.disabled = true;
    
    try {
        // Prepare slides for export - ensure all content is properly formatted
        const processedSlides = appState.slides.map(slide => {
            const processedSlide = {
                layout: slide.layout,
                content: {}
            };
            
            // Process content based on layout type
            if (slide.layout === 'titleAndBullets') {
                processedSlide.content = {
                    title: typeof slide.content.title === 'string' ? slide.content.title : String(slide.content.title || 'Title'),
                    bullets: Array.isArray(slide.content.bullets) ? 
                        slide.content.bullets.map(bullet => String(bullet)) : 
                        [String(slide.content.bullets || 'Bullet point')]
                };
            } 
            else if (slide.layout === 'quote') {
                processedSlide.content = {
                    quote: typeof slide.content.quote === 'string' ? slide.content.quote : String(slide.content.quote || 'Quote'),
                    author: typeof slide.content.author === 'string' ? slide.content.author : String(slide.content.author || 'Author')
                };
            }
            else if (slide.layout === 'imageAndParagraph') {
                processedSlide.content = {
                    title: typeof slide.content.title === 'string' ? slide.content.title : String(slide.content.title || 'Title'),
                    paragraph: typeof slide.content.paragraph === 'string' ? slide.content.paragraph : String(slide.content.paragraph || 'Paragraph'),
                    imageDescription: typeof slide.content.imageDescription === 'string' ? 
                        slide.content.imageDescription : String(slide.content.imageDescription || 'Image description')
                };
            }
            else if (slide.layout === 'twoColumn') {
                processedSlide.content = {
                    title: typeof slide.content.title === 'string' ? slide.content.title : String(slide.content.title || 'Title'),
                    column1Title: typeof slide.content.column1Title === 'string' ? 
                        slide.content.column1Title : String(slide.content.column1Title || 'Column 1'),
                    column2Title: typeof slide.content.column2Title === 'string' ? 
                        slide.content.column2Title : String(slide.content.column2Title || 'Column 2'),
                    column1Content: typeof slide.content.column1Content === 'string' ? 
                        slide.content.column1Content : String(slide.content.column1Content || 'Column 1 content'),
                    column2Content: typeof slide.content.column2Content === 'string' ? 
                        slide.content.column2Content : String(slide.content.column2Content || 'Column 2 content')
                };
            }
            else if (slide.layout === 'titleOnly') {
                processedSlide.content = {
                    title: typeof slide.content.title === 'string' ? slide.content.title : String(slide.content.title || 'Title'),
                    subtitle: typeof slide.content.subtitle === 'string' ? slide.content.subtitle : String(slide.content.subtitle || 'Subtitle')
                };
            }
            
            return processedSlide;
        });
        
        // Call the backend to export PPTX
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                slides: processedSlides,
                template: appState.templateId,
                topic: appState.topic
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        // Convert response to blob
        const blob = await response.blob();
        
        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appState.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.pptx`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Presentation exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting to PPTX:', error);
        showNotification('Failed to export presentation. Please try again.', 'error');
    } finally {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        exportBtn.disabled = false;
    }
}
    
    // Regenerate with different layouts
    function handleRegenerate() {
        // Exit edit mode before regenerating
        if (currentState.editMode) {
            exitEditMode();
        }
        handleGenerate();
    }
    
    // Render the current slide preview
    function renderCurrentSlide() {
        const slideData = currentState.slides[currentState.currentSlideIndex];
        
        if (!slideData) {
            return;
        }
        
        // If in edit mode, render the edit form
        if (currentState.editMode) {
            renderEditForm(slideData);
            return;
        }
        
        // Get the template and layout
        const template = getTemplateById(currentState.templateId);
        const layout = getLayoutById(slideData.layout);
        
        if (!template || !layout) {
            console.error('Template or layout not found', { templateId: currentState.templateId, layoutType: slideData.layout });
            return;
        }
        
        // Render the slide HTML
        const slideHtml = layout.render(slideData.content, template);
        
        // Add slide indicator and navigation
        const navigationHtml = createNavigationHtml();
        
        // REMOVED: No longer adding edit button inside the slide preview
        slidePreview.innerHTML = slideHtml + navigationHtml;
        
        // Set up navigation event listeners
        setupNavigationEventListeners();
        
        // Update the edit button
        updateEditButton();
    }
    
    // Enter edit mode
    function enterEditMode() {
        currentState.editMode = true;
        renderCurrentSlide();
        updateEditButton();
    }
    
    // Exit edit mode without saving
    function exitEditMode() {
        currentState.editMode = false;
        renderCurrentSlide();
        updateEditButton();
    }
    
    // Save the current edit
    function saveCurrentEdit() {
        const slideData = currentState.slides[currentState.currentSlideIndex];
        const layout = slideData.layout;
        const content = {};
        
        // Get all input values
        const inputs = document.querySelectorAll('.edit-form input, .edit-form textarea');
        inputs.forEach(input => {
            content[input.name] = input.value;
        });
        
        // Process bullet points if present
        const bulletPointsContainer = document.getElementById('bullet-points-container');
        if (bulletPointsContainer) {
            const bulletInputs = bulletPointsContainer.querySelectorAll('input');
            content.bullets = Array.from(bulletInputs).map(input => input.value);
        }
        
        // Special handling for two-column layout
        if (layout === 'twoColumn') {
            // Process column content to maintain array structure
            const col1Content = document.getElementById('column1Content');
            const col2Content = document.getElementById('column2Content');
            
            if (col1Content) {
                content.column1Content = col1Content.value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
            }
            
            if (col2Content) {
                content.column2Content = col2Content.value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
            }
        }
        
        // Update slide content
        slideData.content = content;
        
        // Exit edit mode
        currentState.editMode = false;
        renderCurrentSlide();
    }
    
    // Render the edit form based on layout type
    function renderEditForm(slideData) {
        const layout = slideData.layout;
        const content = slideData.content;
        let formHtml = '';
        
        // Create form fields based on layout type
        if (layout === 'titleAndBullets') {
            formHtml = `
                <h2>Edit Title and Bullets</h2>
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" value="${escapeHTML(content.title || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Bullet Points:</label>
                    <div id="bullet-points-container">
                        ${Array.isArray(content.bullets) ? content.bullets.map((bullet, index) => {
                            const bulletText = typeof bullet === 'string' ? bullet : 
                                              (bullet && bullet.text ? bullet.text : 
                                               (bullet && bullet.bulletPoint ? bullet.bulletPoint : ''));
                            return `
                                <div class="bullet-point-input">
                                    <input type="text" name="bullet-${index}" value="${escapeHTML(bulletText)}" class="form-control">
                                    <button type="button" class="remove-bullet" data-index="${index}">✕</button>
                                </div>
                            `;
                        }).join('') : ''}
                    </div>
                    <button type="button" id="add-bullet" class="btn-secondary">Add Bullet Point</button>
                </div>
            `;
        } else if (layout === 'quote') {
            formHtml = `
                <h2>Edit Quote</h2>
                <div class="form-group">
                    <label for="quote">Quote:</label>
                    <textarea id="quote" name="quote" rows="4" class="form-control">${escapeHTML(content.quote || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="author">Author:</label>
                    <input type="text" id="author" name="author" value="${escapeHTML(content.author || '')}" class="form-control">
                </div>
            `;
        } else if (layout === 'imageAndParagraph') {
            formHtml = `
                <h2>Edit Image and Paragraph</h2>
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" value="${escapeHTML(content.title || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="paragraph">Paragraph:</label>
                    <textarea id="paragraph" name="paragraph" rows="5" class="form-control">${escapeHTML(content.paragraph || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="imageDescription">Image Description:</label>
                    <input type="text" id="imageDescription" name="imageDescription" value="${escapeHTML(content.imageDescription || '')}" class="form-control">
                </div>
            `;
        } else if (layout === 'twoColumn') {
            // Process column content for editing
            const extractColumnContent = (columnContent) => {
                if (!columnContent) return '';
                
                if (Array.isArray(columnContent)) {
                    return columnContent.map(item => {
                        if (typeof item === 'string') {
                            return item;
                        } else if (typeof item === 'object' && item !== null) {
                            return item.text || item.bulletPoint || '';
                        }
                        return '';
                    }).join('\n');
                } else if (typeof columnContent === 'string') {
                    return columnContent;
                }
                
                return '';
            };
            
            const col1ContentText = extractColumnContent(content.column1Content);
            const col2ContentText = extractColumnContent(content.column2Content);
            
            formHtml = `
                <h2>Edit Two Columns</h2>
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" value="${escapeHTML(content.title || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="column1Title">Column 1 Title:</label>
                    <input type="text" id="column1Title" name="column1Title" value="${escapeHTML(content.column1Title || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="column1Content">Column 1 Content:</label>
                    <p class="form-help">Enter each point on a new line.</p>
                    <textarea id="column1Content" name="column1Content" rows="6" class="form-control">${escapeHTML(col1ContentText)}</textarea>
                </div>
                <div class="form-group">
                    <label for="column2Title">Column 2 Title:</label>
                    <input type="text" id="column2Title" name="column2Title" value="${escapeHTML(content.column2Title || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="column2Content">Column 2 Content:</label>
                    <p class="form-help">Enter each point on a new line.</p>
                    <textarea id="column2Content" name="column2Content" rows="6" class="form-control">${escapeHTML(col2ContentText)}</textarea>
                </div>
            `;
        } else if (layout === 'titleOnly') {
            formHtml = `
                <h2>Edit Title Slide</h2>
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" value="${escapeHTML(content.title || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="subtitle">Subtitle:</label>
                    <input type="text" id="subtitle" name="subtitle" value="${escapeHTML(content.subtitle || '')}" class="form-control">
                </div>
            `;
        }
        
        // Create form with buttons
        const editFormHtml = `
            <div class="edit-form">
                ${formHtml}
                <div class="edit-actions">
                    <button type="button" id="save-edit" class="btn-primary">Save Changes</button>
                    <button type="button" id="cancel-edit" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        // Add slide indicator
        const slideIndicator = `
            <div class="slide-indicator">
                Editing Slide ${currentState.currentSlideIndex + 1} of ${currentState.slides.length}
            </div>
        `;
        
        // Set the HTML
        slidePreview.innerHTML = editFormHtml + slideIndicator;
        
        // Add event listeners for the edit form
        document.getElementById('save-edit').addEventListener('click', saveCurrentEdit);
        document.getElementById('cancel-edit').addEventListener('click', exitEditMode);
        
        // Add bullet point functionality if needed
        const addBulletBtn = document.getElementById('add-bullet');
        if (addBulletBtn) {
            addBulletBtn.addEventListener('click', () => {
                const container = document.getElementById('bullet-points-container');
                const newIndex = container.children.length;
                const newBulletHtml = `
                    <div class="bullet-point-input">
                        <input type="text" name="bullet-${newIndex}" value="" class="form-control">
                        <button type="button" class="remove-bullet" data-index="${newIndex}">✕</button>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', newBulletHtml);
                
                // Add event listener to the new remove button
                const removeButtons = container.querySelectorAll('.remove-bullet');
                removeButtons[removeButtons.length - 1].addEventListener('click', removeBulletPoint);
            });
        }
        
        // Add event listeners to remove bullet buttons
        const removeButtons = document.querySelectorAll('.remove-bullet');
        removeButtons.forEach(button => {
            button.addEventListener('click', removeBulletPoint);
        });
    }
    
    // Helper function to escape HTML in content
    function escapeHTML(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Remove a bullet point
    function removeBulletPoint(e) {
        const container = document.getElementById('bullet-points-container');
        const bulletInput = e.target.parentElement;
        container.removeChild(bulletInput);
        
        // Renumber the remaining bullet points
        const bulletInputs = container.querySelectorAll('.bullet-point-input');
        bulletInputs.forEach((input, index) => {
            const inputField = input.querySelector('input');
            inputField.name = `bullet-${index}`;
            const removeBtn = input.querySelector('.remove-bullet');
            removeBtn.dataset.index = index;
        });
    }
    
    // Create navigation HTML with slider
    function createNavigationHtml() {
        if (currentState.slides.length <= 1) {
            return '';
        }
        
        // Create the slide indicator
        const slideIndicator = `
            <span class="slide-indicator">
                Slide ${currentState.currentSlideIndex + 1} of ${currentState.slides.length}
            </span>
        `;
        
        // Create buttons
        const navButtons = `
            <div class="nav-buttons">
                <button id="prev-slide" ${currentState.currentSlideIndex === 0 ? 'disabled' : ''}>Previous</button>
                <button id="next-slide" ${currentState.currentSlideIndex === currentState.slides.length - 1 ? 'disabled' : ''}>Next</button>
            </div>
        `;
        
        // Create slider
        const sliderInput = `
            <div class="slider-container">
                <input 
                    type="range" 
                    id="slide-slider" 
                    min="0" 
                    max="${currentState.slides.length - 1}" 
                    value="${currentState.currentSlideIndex}"
                    class="slide-slider"
                >
                <div class="slider-labels">
                    ${Array.from({ length: currentState.slides.length }, (_, i) => 
                        `<span class="slider-label ${i === currentState.currentSlideIndex ? 'active' : ''}" 
                               data-slide="${i}">
                            ${i + 1}
                        </span>`
                    ).join('')}
                </div>
            </div>
        `;
        
        return `
            <div class="slide-navigation">
                ${slideIndicator}
                ${sliderInput}
                ${navButtons}
            </div>
        `;
    }
    
    // Set up event listeners for navigation
    function setupNavigationEventListeners() {
        // Button navigation
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', showPreviousSlide);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', showNextSlide);
        }
        
        // Slider navigation
        const slider = document.getElementById('slide-slider');
        if (slider) {
            slider.addEventListener('input', handleSliderChange);
        }
        
        // Slider label navigation
        const sliderLabels = document.querySelectorAll('.slider-label');
        sliderLabels.forEach(label => {
            label.addEventListener('click', () => {
                const slideIndex = parseInt(label.dataset.slide, 10);
                if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < currentState.slides.length) {
                    if (currentState.editMode) {
                        const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                        if (confirmChange) {
                            currentState.editMode = false;
                            currentState.currentSlideIndex = slideIndex;
                            renderCurrentSlide();
                        }
                    } else {
                        currentState.currentSlideIndex = slideIndex;
                        renderCurrentSlide();
                    }
                }
            });
        });
    }
    
    // Handle slider change
    function handleSliderChange(e) {
        const slideIndex = parseInt(e.target.value, 10);
        if (slideIndex !== currentState.currentSlideIndex) {
            if (currentState.editMode) {
                const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                if (confirmChange) {
                    currentState.editMode = false;
                    currentState.currentSlideIndex = slideIndex;
                    renderCurrentSlide();
                } else {
                    // Reset slider value
                    e.target.value = currentState.currentSlideIndex;
                }
            } else {
                currentState.currentSlideIndex = slideIndex;
                renderCurrentSlide();
            }
        }
    }
    
    // Add slide navigation controls
    function addSlideNavigation() {
        const navigationHtml = createNavigationHtml();
        slidePreview.insertAdjacentHTML('beforeend', navigationHtml);
        setupNavigationEventListeners();
    }
    
    // Show previous slide
    function showPreviousSlide() {
        if (currentState.currentSlideIndex > 0) {
            if (currentState.editMode) {
                const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                if (confirmChange) {
                    currentState.editMode = false;
                    currentState.currentSlideIndex--;
                    renderCurrentSlide();
                }
            } else {
                currentState.currentSlideIndex--;
                renderCurrentSlide();
            }
        }
    }
    
    // Show next slide
    function showNextSlide() {
        if (currentState.currentSlideIndex < currentState.slides.length - 1) {
            if (currentState.editMode) {
                const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                if (confirmChange) {
                    currentState.editMode = false;
                    currentState.currentSlideIndex++;
                    renderCurrentSlide();
                }
            } else {
                currentState.currentSlideIndex++;
                renderCurrentSlide();
            }
        }
    }
    
    // Initialize with placeholder message
    if (slidePreview.innerHTML.trim() === '') {
        slidePreview.innerHTML = `
            <div class="placeholder-message">
                Your slide preview will appear here
            </div>
        `;
    }
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (currentState.slides.length <= 1 || currentState.editMode) return;
        
        // Left arrow key
        if (e.key === 'ArrowLeft' && currentState.currentSlideIndex > 0) {
            showPreviousSlide();
        }
        // Right arrow key
        else if (e.key === 'ArrowRight' && currentState.currentSlideIndex < currentState.slides.length - 1) {
            showNextSlide();
        }
    });
});