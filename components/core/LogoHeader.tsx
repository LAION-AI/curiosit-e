import { headerContent } from "../../internalization/content.ts";

type SupportedLanguage = "en" | "fr" | "es";

export default function LogoHeader({ lang }: { lang: string }) {
    // Ensure we use a supported language or default to English
    const safeLanguage = (lang as SupportedLanguage) in headerContent 
        ? (lang as SupportedLanguage) 
        : "en";

    return (
        <div className="flex items-center space-x-3 drop-shadow-sm">
            {/* Logo Image */}
            <img
                src="/logo-curiosit-e.png"
                width="60"
                height="60"
                alt="Curiosit-e Logo"
                className="rounded-md shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
            />

            <div className="flex flex-col">
                {/* Over Title */}
                <h2 className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">
                    {headerContent[safeLanguage].overTitle}
                </h2>

                {/* Main Title */}
                <h1 className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 font-bold font-serif">
                    {headerContent[safeLanguage].title}
                </h1>
            </div>
        </div>
    )
}
