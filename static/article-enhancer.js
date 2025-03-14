//@ts-ignore
/**
 * Article Enhancer Script
 * Handles reading progress, collapsible citations, and jump-to-top functionality
 */

if (typeof document !== 'undefined') {
  // Initialize all enhancements when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
      // Reading Progress
    initReadingProgress();
    
    // Citations Toggle
    initCitationsToggle();
    
    // Jump to Top Button
    initJumpToTopButton();
    
    // Audio Player styling
    initAudioPlayers();
  });
}

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
    progressBar.style.width = `${scrolled}%`;
  }
  
  // Add scroll event listener
  window.addEventListener('scroll', updateProgress);
  
  // Initial update
  updateProgress();
}

/**
 * Initialize citations toggle functionality
 */
export function initCitationsToggle() {
  if (typeof window === 'undefined' || !document) {
    return;
  }
  // Find all citations sections - use the exact structure we know exists
  const citationsDiv = document.querySelector('.citations');
  console.log('citationsDiv', citationsDiv);
  
  if (!citationsDiv) {
    console.log('No citations found');
    return;
  }
  
  // Get the elements we need
  const citationTitle = citationsDiv.querySelector('h2');
  const citationList = citationsDiv.querySelector('#citation-list');
  
  if (!citationTitle || !citationList) {
    console.log('Citations structure not as expected');
    return;
  }
  
  // Create the toggle icon
  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'toggle-icon';
  toggleIcon.textContent = '▼';
  toggleIcon.style.marginLeft = '10px';
  toggleIcon.style.cursor = 'pointer';
  
  // Create a header div that will be clickable
  const headerDiv = document.createElement('div');
  headerDiv.className = 'citations-header';
  headerDiv.style.cursor = 'pointer';
  headerDiv.style.display = 'flex';
  headerDiv.style.alignItems = 'center';
  
  // Move the title into our new header and add the toggle
  citationTitle.parentNode.insertBefore(headerDiv, citationTitle);
  headerDiv.appendChild(citationTitle);
  headerDiv.appendChild(toggleIcon);
  
  // Wrap the citation list in a content div
  const contentDiv = document.createElement('div');
  contentDiv.className = 'citations-content';
  
  // Move citation list into content div
  citationList.parentNode.insertBefore(contentDiv, citationList);
  contentDiv.appendChild(citationList);
  
  // Set up toggle functionality
  headerDiv.addEventListener('click', () => {
    const isHidden = contentDiv.style.display === 'none';
    contentDiv.style.display = isHidden ? 'block' : 'none';
    toggleIcon.textContent = isHidden ? '▲' : '▼';
    citationsDiv.classList.toggle('expanded', isHidden);
  });
  
  // Hide content by default
  contentDiv.style.display = 'none';
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
  window.addEventListener('scroll', () => {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
      jumpToTopBtn.classList.add('visible');
    } else {
      jumpToTopBtn.classList.remove('visible');
    }
  });
  
  // Scroll to top when button is clicked
  jumpToTopBtn.addEventListener('click', () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
}

// Enable audio player styling if any exist on the page
function initAudioPlayers() {
  const audioElements = document.querySelectorAll('audio');
  
  for (const audio of audioElements) {
    if (!audio.parentNode.classList.contains('custom-audio-player')) {
      // Create wrapper if not already wrapped
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-audio-player';
      audio.parentNode.insertBefore(wrapper, audio);
      wrapper.appendChild(audio);
    }
  }
} 