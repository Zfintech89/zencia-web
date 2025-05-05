// templates.js - Defines the available slide templates

const templates = [
    {
        id: 'corporate',
        name: 'Corporate',
        description: 'Professional blue theme for business presentations',
        colors: {
            primary: '#0f4c81',
            secondary: '#6e9cc4',
            accent: '#f2b138',
            background: '#ffffff',
            text: '#333333'
        },
        fontFamily: 'Arial, sans-serif',
        preview: 'corporate-preview.png'
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Colorful theme for creative presentations',
        colors: {
            primary: '#ff6b6b',
            secondary: '#4ecdc4',
            accent: '#ffd166',
            background: '#f9f1e6',
            text: '#5a3921'
        },
        fontFamily: 'Georgia, serif',
        preview: 'creative-preview.png'
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean, simple design with lots of whitespace',
        colors: {
            primary: '#2c3e50',
            secondary: '#95a5a6',
            accent: '#e74c3c',
            background: '#f8f8f8',
            text: '#222222'
        },
        fontFamily: 'Helvetica, Arial, sans-serif',
        preview: 'minimal-preview.png'
    },
    {
        id: 'dark',
        name: 'Dark',
        description: 'Dark mode for modern presentations',
        colors: {
            primary: '#bb86fc',
            secondary: '#03dac6',
            accent: '#cf6679',
            background: '#1a1a1a',
            text: '#f5f5f5'
        },
        fontFamily: 'Roboto, sans-serif',
        preview: 'dark-preview.png'
    }
];

// Function to initialize the template selector
function initializeTemplateSelector() {
    const templatesContainer = document.getElementById('templates-container');
    
    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-option';
        templateElement.dataset.templateId = template.id;
        
        templateElement.innerHTML = `
            <div class="template-preview" style="background-color: ${template.colors.background}; color: ${template.colors.text}">
                <div style="height: 10px; background-color: ${template.colors.primary}"></div>
                <div style="text-align: center; margin-top: 30px;">
                    <span style="color: ${template.colors.primary}">${template.name}</span>
                </div>
            </div>
            <p>${template.name}</p>
        `;
        
        templateElement.addEventListener('click', () => {
            // Remove selected class from all templates
            document.querySelectorAll('.template-option').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selected class to this template
            templateElement.classList.add('selected');
            
            // Store the selected template
            window.selectedTemplateId = template.id;
        });
        
        templatesContainer.appendChild(templateElement);
    });
}

// Function to get a template by ID
function getTemplateById(templateId) {
    return templates.find(template => template.id === templateId);
}

// Initialize templates when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTemplateSelector);

// Make functions available globally
window.getTemplateById = getTemplateById;