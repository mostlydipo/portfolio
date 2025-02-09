import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { GET_FREELANCER_RECOMMENDATIONS } from "@/utils/constants";
import Pagination from '@/components/Pagination';

function SearchResults() {
    const router = useRouter();
    const { prompt } = router.query;
    const [results, setResults] = useState({ gigs: [], users: [], totalGigPages: 1, totalUserPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pageGigs, setPageGigs] = useState(1);
    const [pageUsers, setPageUsers] = useState(1);

    useEffect(() => {
        if (!prompt) return;

        setPageGigs(1);
        setPageUsers(1);
    }, [prompt]);

    useEffect(() => {
        if (!prompt) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await axios.post(GET_FREELANCER_RECOMMENDATIONS, {
                    prompt,
                    pageGigs,
                    pageUsers,
                });
                setResults(response.data);
            } catch (error) {
                console.error("Error fetching search results:", error);
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [prompt, pageGigs, pageUsers]);

    const navigateToGig = (gigId) => {
        router.push(`/gig/${gigId}`);
    };

    if (loading) {
        return <p className="mt-10 text-lg text-center text-gray-600">Loading...</p>;
    }

    if (error) {
        return <p className="mt-10 text-lg text-center text-red-600">{error}</p>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold mt-10 mb-6 text-center text-gray-800">Search Results</h1>

            {/* Display Gigs */}
            {results.gigs?.length > 0 ? (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                        {results.gigs.map((gig) => (
                            <div
                                key={gig.id}
                                className="p-4 sm:p-5 border border-gray-200 rounded-xl shadow-lg bg-white hover:shadow-2xl transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer"
                                onClick={() => navigateToGig(gig.id)}
                            >
                                <h2 className="text-lg sm:text-xl font-semibold mb-3 text-green-700">{gig.title}</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{gig.shortDesc}</p>
                                <div className="text-xs sm:text-sm text-gray-600">
                                    <p className="mb-1"><span className="font-bold text-gray-800">Price:</span> ₦{gig.price}</p>
                                    <p className="mb-1"><span className="font-bold text-gray-800">Location:</span> {gig.city}, {gig.state}</p>
                                    <p className="mb-1"><span className="font-bold text-gray-800">Delivery:</span> {gig.deliveryTime} {gig.timeUnit || 'days'}</p>
                                    <p>
                                        <span className="font-bold text-gray-800">Posted by:</span>
                                        {gig.createdBy ? (gig.createdBy.fullName || gig.createdBy.username || 'Unknown') : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination for Gigs */}
                    <Pagination
                        page={pageGigs}
                        totalPages={results.totalGigPages}
                        onPageChange={(newPage) => setPageGigs(newPage)}
                    />
                </div>

            ) : (
                <p className="mt-10 text-lg text-center text-gray-600">No work was found.</p>
            )}

            {/* Display Users */}
            {results.users?.length > 0 ? (
                <div className="mt-12">
                    <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800">Freelancers</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-6">
                        {results.users.map((user) => (
                            <div key={user.id} className="p-4 sm:p-5 border border-gray-200 rounded-xl shadow-lg bg-white">
                                <h2 className="text-lg sm:text-xl font-semibold mb-3 text-green-700">{user.fullName || user.username}</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3">{user.description}</p>
                                {user.gigs.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-sm sm:text-lg font-semibold mb-2 text-gray-700">Works by {user.username}:</h3>
                                        <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600">
                                            {user.gigs.map((gig) => (
                                                <li key={gig.id}>
                                                    {gig.title} - ₦{gig.price}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Pagination for Users */}
                    <Pagination
                        page={pageUsers}
                        totalPages={results.totalUserPages}
                        onPageChange={(newPage) => setPageUsers(newPage)}
                    />
                </div>
            ) : (
                <p className="mt-10 text-lg text-center text-gray-600">No freelancers were found.</p>
            )}
        </div>
    );
}

export default SearchResults;
