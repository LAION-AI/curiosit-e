/**
 * Article Enhancer Script
 * Handles reading progress, collapsible citations, and jump-to-top functionality
 */

// Initialize all enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Reading Progress
  initReadingProgress();
  
  // Citations Toggle
  initCitationsToggle();
  
  // Jump to Top Button
  initJumpToTopButton();
});

/**
 * Initialize reading progress indicator
 */
function initReadingProgress() {
  // Create reading progress elements
  const progressContainer = document.createElement('div');
  progressContainer.className = 'reading-progress-container';
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress-bar';
  progressContainer.appendChild(progressBar);
  
  // Append to body (not inside any other container to ensure it's at the top)
  document.body.insertBefore(progressContainer, document.body.firstChild);
  
  // Update progress bar on scroll
  function updateProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  }
  
  // Add scroll event listener
  window.addEventListener('scroll', updateProgress);
  
  // Initial update
  updateProgress();
}

/**
 * Initialize citations toggle functionality
 */
function initCitationsToggle() {
  // Find all citations sections
  const citationsSections = findCitationsSections();
  
  // If no citations found, try to create them
  if (citationsSections.length === 0) {
    createCitationsFromReferences();
  }
  
  // Set up toggle functionality for all citations sections
  document.querySelectorAll('.citations').forEach(citations => {
    const header = citations.querySelector('.citations-header');
    const content = citations.querySelector('.citations-content');
    const toggleIcon = citations.querySelector('.toggle-icon');
    
    if (header && content && toggleIcon) {
      // Toggle visibility on click
      header.addEventListener('click', function() {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        toggleIcon.textContent = isHidden ? '▲' : '▼';
        citations.classList.toggle('expanded', isHidden);
      });
      
      // Hide content by default
      content.style.display = 'none';
    }
  });
}

/**
 * Find existing citations sections in the document
 */
function findCitationsSections() {
  return document.querySelectorAll('.citations');
}

/**
 * Create citations sections from references/bibliography headings if they exist
 */
function createCitationsFromReferences() {
  // Find headings that might indicate references/citations
  const refHeadings = document.querySelectorAll('h2, h3');
  
  refHeadings.forEach(heading => {
    const headingText = heading.textContent.trim().toLowerCase();
    if (['references', 'citations', 'bibliography', 'sources'].includes(headingText)) {
      // This is a references heading
      wrapInCitationsContainer(heading);
    }
  });
}

/**
 * Wrap a references heading and its content in a citations container
 */
function wrapInCitationsContainer(heading) {
  // Create citations container
  const citationsDiv = document.createElement('div');
  citationsDiv.className = 'citations';
  
  // Create header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'citations-header';
  
  // Clone the heading to preserve any attributes or styling
  const headingClone = heading.cloneNode(true);
  
  // Create toggle icon
  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'toggle-icon';
  toggleIcon.textContent = '▼';
  
  // Add heading and toggle icon to header
  headerDiv.appendChild(headingClone);
  headerDiv.appendChild(toggleIcon);
  
  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.className = 'citations-content';
  
  // Collect all content after the heading until the next heading or end of parent
  let currentNode = heading.nextSibling;
  const contentNodes = [];
  
  while (currentNode) {
    // Stop if we hit another heading of same or higher level
    if (currentNode.nodeType === 1 && 
        (currentNode.tagName === 'H1' || 
         currentNode.tagName === 'H2' || 
         currentNode.tagName === heading.tagName)) {
      break;
    }
    
    // Add to content
    contentNodes.push(currentNode);
    const nextNode = currentNode.nextSibling;
    currentNode = nextNode;
  }
  
  // Add all content nodes to contentDiv
  contentNodes.forEach(node => {
    contentDiv.appendChild(node);
  });
  
  // Assemble the citations div
  citationsDiv.appendChild(headerDiv);
  citationsDiv.appendChild(contentDiv);
  
  // Replace the original heading with our new citations div
  heading.parentNode.replaceChild(citationsDiv, heading);
}

/**
 * Initialize jump to top button
 */
function initJumpToTopButton() {
  // Create jump to top button
  const jumpToTopBtn = document.createElement('button');
  jumpToTopBtn.id = 'jumpToTopBtn';
  jumpToTopBtn.className = 'jump-to-top';
  jumpToTopBtn.title = 'Go to top';
  jumpToTopBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  `;
  
  // Append to body
  document.body.appendChild(jumpToTopBtn);
  
  // Show button when user scrolls down 300px
  window.addEventListener('scroll', function() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
      jumpToTopBtn.classList.add('visible');
    } else {
      jumpToTopBtn.classList.remove('visible');
    }
  });
  
  // Scroll to top when button is clicked
  jumpToTopBtn.addEventListener('click', function() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
}

// Export functions for testing if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initReadingProgress,
    initCitationsToggle,
    initJumpToTopButton
  };
} 