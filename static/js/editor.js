// editor.js - Enhanced presentation editor with history and user features

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const topicInput = document.getElementById('topic');
    const slideCountInput = document.getElementById('slide-count');
    const generateBtn = document.getElementById('generate-btn');
    const exportBtn = document.getElementById('export-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const saveBtn = document.getElementById('save-btn');
    const slidePreview = document.getElementById('slide-preview');
    const loadingIndicator = document.getElementById('loading');
    const slidesList = document.getElementById('slides-list');
    const slidesControls = document.getElementById('slide-controls');
    const editControlsContainer = document.getElementById('external-edit-controls');
    
    // Application state
    const appState = {
        slides: [],
        templateId: null,
        topic: null,
        currentSlideIndex: 0,
        editMode: false,
        presentationId: null,
        isModified: false
    };
    
    // Initialize with existing presentation data if editing
    if (window.existingPresentation) {
        initializeWithExistingPresentation(window.existingPresentation);
    }
    
    // Initialize template selector
    initializeTemplateSelector();
    
    // Event listeners
    generateBtn.addEventListener('click', handleGenerate);
    exportBtn.addEventListener('click', handleExport);
    regenerateBtn.addEventListener('click', handleRegenerate);
    saveBtn.addEventListener('click', handleSave);
    
    // Initialize from existing presentation
    function initializeWithExistingPresentation(presentation) {
        appState.presentationId = presentation.id;
        appState.topic = presentation.topic;
        appState.templateId = presentation.template_id;
        appState.slides = presentation.slides.map(slide => ({
            layout: slide.layout,
            content: slide.content
        }));
        
        // Set form values
        topicInput.value = appState.topic;
        slideCountInput.value = presentation.slide_count;
        
        // Select the template
        setTimeout(() => {
            const templateOptions = document.querySelectorAll('.template-option');
            templateOptions.forEach(option => {
                if (option.dataset.templateId === appState.templateId) {
                    option.click();
                }
            });
            
            // Enable buttons
            exportBtn.disabled = false;
            regenerateBtn.disabled = false;
            
            // Show slides
            renderSlidesList();
            renderCurrentSlide();
        }, 100);
    }
    
    // Generate slides
    async function handleGenerate() {
        const topic = topicInput.value.trim();
        const templateId = window.selectedTemplateId;
        const slideCount = parseInt(slideCountInput.value, 10) || 1;
        
        // Validate input
        if (!topic) {
            showNotification('Please enter a presentation topic', 'error');
            return;
        }
        
        if (!templateId) {
            showNotification('Please select a template', 'error');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        slidePreview.innerHTML = '';
        editControlsContainer.classList.add('hidden');
        
        // Disable buttons during generation
        generateBtn.disabled = true;
        exportBtn.disabled = true;
        regenerateBtn.disabled = true;
        saveBtn.disabled = true;
        
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
            appState.slides = data.slides;
            appState.templateId = templateId;
            appState.topic = topic;
            appState.currentSlideIndex = 0;
            appState.editMode = false;
            appState.isModified = true;
            
            // Render slides
            renderSlidesList();
            renderCurrentSlide();
            
            // Enable buttons
            exportBtn.disabled = false;
            regenerateBtn.disabled = false;
            saveBtn.disabled = false;
            
            showNotification('Presentation generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating slides:', error);
            showNotification('Failed to generate presentation. Please try again.', 'error');
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
    
    // Save presentation
    async function handleSave() {
        if (!appState.slides || appState.slides.length === 0) {
            showNotification('Please generate slides first', 'error');
            return;
        }
        
        // Exit edit mode before saving
        if (appState.editMode) {
            saveCurrentEdit();
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        saveBtn.disabled = true;
        
        try {
            // Prepare data for saving
            const saveData = {
                id: appState.presentationId,
                topic: appState.topic,
                template: appState.templateId,
                slides: appState.slides
            };
            
            // Call the backend to save
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Update presentation ID if new
            if (!appState.presentationId) {
                appState.presentationId = result.presentation.id;
                // Update URL without reloading
                window.history.pushState(
                    {}, 
                    '', 
                    `/editor/${result.presentation.id}`
                );
            }
            
            // Mark as not modified
            appState.isModified = false;
            
            showNotification('Presentation saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving presentation:', error);
            showNotification('Failed to save presentation. Please try again.', 'error');
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            saveBtn.disabled = false;
        }
    }
    
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
            // Call the backend to export PPTX
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    slides: appState.slides,
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
        if (appState.editMode) {
            exitEditMode();
        }
        handleGenerate();
    }
    
    // Render the list of slides
    function renderSlidesList() {
        if (!appState.slides || appState.slides.length === 0) {
            slidesList.innerHTML = `
                <div class="slides-placeholder">
                    Slides will appear here after generation
                </div>
            `;
            return;
        }
        
        const slidesHtml = appState.slides.map((slide, index) => {
            const template = getTemplateById(appState.templateId);
            const layout = getLayoutById(slide.layout);
            
            if (!template || !layout) {
                console.error('Template or layout not found', { 
                    templateId: appState.templateId, 
                    layoutType: slide.layout 
                });
                return '';
            }
            
            // Create a thumbnail container
            const isActive = index === appState.currentSlideIndex;
            
            return `
                <div class="slide-thumbnail ${isActive ? 'active' : ''}" data-index="${index}">
                    <div class="slide-thumbnail-content">
                        ${layout.render(slide.content, template)}
                    </div>
                    <div class="slide-number">Slide ${index + 1}</div>
                </div>
            `;
        }).join('');
        
        slidesList.innerHTML = slidesHtml;
        
        // Add click event listeners to thumbnails
        const thumbnails = slidesList.querySelectorAll('.slide-thumbnail');
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                const index = parseInt(thumbnail.dataset.index, 10);
                if (appState.editMode) {
                    const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                    if (confirmChange) {
                        appState.editMode = false;
                        appState.currentSlideIndex = index;
                        renderCurrentSlide();
                    }
                } else {
                    appState.currentSlideIndex = index;
                    renderCurrentSlide();
                }
            });
        });
    }
    
    // Render the current slide preview
    function renderCurrentSlide() {
        const slideData = appState.slides[appState.currentSlideIndex];
        
        if (!slideData) {
            slidePreview.innerHTML = `
                <div class="placeholder-message">
                    No slide data available
                </div>
            `;
            return;
        }
        
        // If in edit mode, render the edit form
        if (appState.editMode) {
            renderEditForm(slideData);
            return;
        }
        
        // Get the template and layout
        const template = getTemplateById(appState.templateId);
        const layout = getLayoutById(slideData.layout);
        
        if (!template || !layout) {
            console.error('Template or layout not found', { 
                templateId: appState.templateId, 
                layoutType: slideData.layout 
            });
            return;
        }
        
        // Render the slide HTML
        const slideHtml = layout.render(slideData.content, template);
        
        // Update the preview
        slidePreview.innerHTML = slideHtml;
        
        // Update slide controls
        renderSlideControls();
        
        // Show edit button
        updateEditButton();
    }
    
    // Render slide navigation controls
    function renderSlideControls() {
        if (appState.slides.length <= 1) {
            slidesControls.innerHTML = '';
            return;
        }
        
        const controlsHtml = `
            <span class="slide-indicator">
                Slide ${appState.currentSlideIndex + 1} of ${appState.slides.length}
            </span>
            <div class="slide-navigation">
                <button id="prev-slide" class="btn" ${appState.currentSlideIndex === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <button id="next-slide" class="btn" ${appState.currentSlideIndex === appState.slides.length - 1 ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        slidesControls.innerHTML = controlsHtml;
        
        // Add event listeners
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', showPreviousSlide);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', showNextSlide);
        }
    }
    
    // Update the edit button
    function updateEditButton() {
        // Only show the edit button if we have slides and are not in edit mode
        if (appState.slides.length > 0 && !appState.editMode) {
            editControlsContainer.innerHTML = `
                <button id="edit-slide-btn" class="edit-btn">Edit Slide Content</button>
            `;
            editControlsContainer.classList.remove('hidden');
            
            // Add event listener to the button
            document.getElementById('edit-slide-btn').addEventListener('click', enterEditMode);
        } else {
            editControlsContainer.classList.add('hidden');
        }
    }
    
    // Enter edit mode
    function enterEditMode() {
        appState.editMode = true;
        renderCurrentSlide();
    }
    
    // Exit edit mode without saving
    function exitEditMode() {
        appState.editMode = false;
        renderCurrentSlide();
    }
    
    // Save the current edit
    function saveCurrentEdit() {
        const slideData = appState.slides[appState.currentSlideIndex];
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
        
        // Mark as modified
        appState.isModified = true;
        
        // Exit edit mode
        appState.editMode = false;
        renderCurrentSlide();
        
        // Update slide thumbnail
        renderSlidesList();
        
        showNotification('Slide updated successfully!', 'success');
    }
    
    // Render the edit form
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
                    <button type="button" id="add-bullet" class="btn btn-secondary">Add Bullet Point</button>
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
                    <button type="button" id="save-edit" class="btn btn-primary">Save Changes</button>
                    <button type="button" id="cancel-edit" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        // Set the HTML
        slidePreview.innerHTML = editFormHtml;
        
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
    
    // Show previous slide
    function showPreviousSlide() {
        if (appState.currentSlideIndex > 0) {
            if (appState.editMode) {
                const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                if (confirmChange) {
                    appState.editMode = false;
                    appState.currentSlideIndex--;
                    renderCurrentSlide();
                    renderSlidesList();
                }
            } else {
                appState.currentSlideIndex--;
                renderCurrentSlide();
                renderSlidesList();
            }
        }
    }
    
    // Show next slide
    function showNextSlide() {
        if (appState.currentSlideIndex < appState.slides.length - 1) {
            if (appState.editMode) {
                const confirmChange = confirm('You have unsaved changes. Do you want to continue?');
                if (confirmChange) {
                    appState.editMode = false;
                    appState.currentSlideIndex++;
                    renderCurrentSlide();
                    renderSlidesList();
                }
            } else {
                appState.currentSlideIndex++;
                renderCurrentSlide();
                renderSlidesList();
            }
        }
    }
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (appState.slides.length <= 1 || appState.editMode) return;
        
        // Left arrow key
        if (e.key === 'ArrowLeft' && appState.currentSlideIndex > 0) {
            showPreviousSlide();
        }
        // Right arrow key
        else if (e.key === 'ArrowRight' && appState.currentSlideIndex < appState.slides.length - 1) {
            showNextSlide();
        }
    });
    
    // Show notification
    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        const messageEl = notification.querySelector('.notification-message');
        
        notification.className = 'notification';
        notification.classList.add(type);
        messageEl.textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Check for unsaved changes before leaving
    window.addEventListener('beforeunload', (e) => {
        if (appState.isModified) {
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    });
    
    // Initialize with placeholder message
    if (slidePreview.innerHTML.trim() === '') {
        slidePreview.innerHTML = `
            <div class="placeholder-message">
                Your slide preview will appear here after generating content
            </div>
        `;
    }
}); 