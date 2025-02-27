import LogoHeader from "./core/LogoHeader.tsx";
import DarkModeToggle from "../islands/DarkModeToggle.tsx";
import HeaderMenu from "../islands/HeaderMenu.tsx";
import SearchModal from "../islands/SearchModal.tsx";

export default function Header({ lang = "en" }: { lang?: string }) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md py-3 px-4 md:px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="flex-shrink-0">
          <LogoHeader lang={lang} />
        </a>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
            <a href="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
              Home
            </a>
            <a href="/articles" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
              Articles
            </a>
          </nav>
          <DarkModeToggle />
        </div>
        
        {/* Mobile Menu Button and Navigation */}
        <HeaderMenu lang={lang} />
        
        {/* Search Modal */}
        <SearchModal />
      </div>
    </header>
  );
} 