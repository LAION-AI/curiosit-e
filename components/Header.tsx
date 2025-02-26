import { useState } from "preact/hooks";
import LogoHeader from "./core/LogoHeader.tsx";
import DarkModeToggle from "../islands/DarkModeToggle.tsx";

export default function Header({ lang = "en" }: { lang?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md py-3 px-4 md:px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/articles" className="flex-shrink-0">
          <LogoHeader lang={lang} />
        </a>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
            <a href="/articles" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
              Articles
            </a>
            <a href="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
              Home
            </a>
          </nav>
          <DarkModeToggle />
        </div>
        
        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-3 md:hidden">
          <DarkModeToggle />
          <button 
            onClick={toggleMenu}
            type="button"
            className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 py-2 px-4 mt-2 rounded-md shadow-lg">
          <nav className="flex flex-col space-y-3">
            <a 
              href="/articles" 
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Articles
            </a>
            <a 
              href="/" 
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
          </nav>
        </div>
      )}
    </header>
  );
} 