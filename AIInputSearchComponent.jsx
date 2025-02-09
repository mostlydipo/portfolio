import { useState } from "react";
import { useRouter } from 'next/router';

function AIInputSearchComponentNoClick() {
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSearch = () => {
        if (prompt.length < 5) {
            setError("Please provide a more detailed description.");
            return;
        }

        setError("");

        // Redirect to the results page and pass the prompt
        router.push({
            pathname: '/search-results',
            query: { prompt },
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="relative p-2 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-full shadow-md transition-all duration-500 w-full sm:w-[300px] md:w-[400px] lg:w-[600px] z-30 flex items-center">
            <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Search with AI"
                className="w-full p-2 pr-10 text-white bg-transparent border-none rounded-full placeholder-gray-400 focus:outline-none h-8 text-xs sm:text-sm md:text-base"
                onKeyDown={handleKeyDown}
            />

            <button
                onClick={handleSearch}
                className="absolute right-2 top-2 bg-transparent text-white p-2 focus:outline-none"
            >
                🔍
            </button>

            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
    );
}

export default AIInputSearchComponentNoClick;
