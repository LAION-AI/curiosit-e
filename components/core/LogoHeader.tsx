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
                width="50"
                height="50"
                alt="Curiosit-e Logo"
                className="rounded-md transition-all duration-300"
            />

            <div className="flex flex-col">
                {/* Main Title */}
                <h1 className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 font-bold">
                    {headerContent[safeLanguage].title}
                </h1>
            </div>
        </div>
    )
}
