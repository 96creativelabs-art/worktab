// Additional JavaScript functionality for WorkTab website
// This file is optional - all JS is embedded in index.html

// Analytics tracking (replace with your analytics code)
function trackEvent(eventName, eventData = {}) {
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    
    // Example: Custom analytics
    console.log('Event tracked:', eventName, eventData);
}

// Track download button clicks
document.addEventListener('DOMContentLoaded', function() {
    const downloadButtons = document.querySelectorAll('a[href="#download"]');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('download_clicked', {
                button_text: this.textContent.trim(),
                section: this.closest('section')?.id || 'unknown'
            });
        });
    });
    
    // Track feature card interactions
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const featureTitle = this.querySelector('h3')?.textContent;
            trackEvent('feature_hovered', {
                feature: featureTitle
            });
        });
    });
    
    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', function() {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            if (maxScrollDepth % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                trackEvent('scroll_depth', {
                    depth: maxScrollDepth
                });
            }
        }
    });
});

// Newsletter signup (if you add one)
function handleNewsletterSignup(email) {
    // Replace with your newsletter service integration
    console.log('Newsletter signup:', email);
    
    // Example: Mailchimp, ConvertKit, etc.
    // fetch('/api/newsletter', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email })
    // });
    
    trackEvent('newsletter_signup', { email });
}

// Contact form handling (if you add one)
function handleContactForm(formData) {
    // Replace with your form handling service
    console.log('Contact form submitted:', formData);
    
    // Example: Formspree, Netlify Forms, etc.
    // fetch('/api/contact', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(formData)
    // });
    
    trackEvent('contact_form_submitted', {
        name: formData.name,
        email: formData.email
    });
}

// Performance monitoring
function measurePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                trackEvent('page_performance', {
                    load_time: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    dom_ready: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                    first_paint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
                });
            }, 0);
        });
    }
}

// Initialize performance monitoring
measurePerformance();

// Error tracking
window.addEventListener('error', function(e) {
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// Export functions for use in HTML
window.WorkTabWebsite = {
    trackEvent,
    handleNewsletterSignup,
    handleContactForm
};











