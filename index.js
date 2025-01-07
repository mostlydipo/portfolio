import { GET_USER_GIGS_ROUTE } from "../../../utils/constants";
import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/router';
import { pluralizeTimeUnit } from '@/utils/pluralize';
import { FaFacebook, FaTwitter, FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';
import MobileBottomNav from "@/components/MobileBottomNavbar";

function Index() {
    const [cookies] = useCookies();
    const [gigs, setGigs] = useState([]);
    const [userId, setUserId] = useState(null); // For generating the shareable link
    const router = useRouter();

    useEffect(() => {
        const getUserGigs = async () => {
            try {
                const response = await axios.get(GET_USER_GIGS_ROUTE, {
                    headers: {
                        Authorization: `Bearer ${cookies.jwt}`,
                    },
                });

                const { gigs: gigsData, user } = response.data;

                if (user) {
                    setUserId(user.id); // Set userId from the response
                } else {
                }

                setGigs(gigsData);
            } catch (err) {
                console.log("Error fetching gigs:", err);
            }
        };
        getUserGigs();
    }, [cookies.jwt]);

    const handleShareLink = () => {
        if (!userId) {
            alert("Unable to generate shareable link. Please try again later.");
            return;
        }
        const shareableLink = `${window.location.origin}/seller/gigs/public/${userId}`;
        navigator.clipboard
            .writeText(shareableLink)
            .then(() => {
                alert("Shareable link copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy link:", err);
                alert("Failed to copy link. Please try again.");
            });
    };

    const handleSocialClick = (platform) => {
        if (!userId) return;

        const shareableLink = `${window.location.origin}/seller/gigs/public/${userId}`;

        // Open the social media link
        let url = '';
        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableLink)}`;
                break;
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareableLink)}`;
                break;
            case 'instagram':
                alert("Instagram sharing is not directly supported via URL. Copy the link to share.");
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareableLink)}`;
                break;
            default:
                break;
        }

        // Open the link in a new tab if available
        if (url) {
            window.open(url, '_blank');
        }

        // Copy the shareable link to clipboard
        navigator.clipboard.writeText(shareableLink).then(() => {
            alert("Shareable link copied to clipboard!");
        }).catch((err) => {
            console.error("Failed to copy link:", err);
            alert("Failed to copy link. Please try again.");
        });
    };


    return (
        <div className="min-h-[80vh] my-6 mt-0 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">All Offers</h3>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
                    {/* Text and Icons on small screens, below the button on small screens */}
                    <div className="flex flex-col items-start sm:items-center space-y-2 lg:space-y-0 sm:space-x-2 sm:flex-row">
                        <p className="text-sm text-gray-600">Share a link to your offers</p>
                        <div className="flex space-x-4">
                            <FaFacebook
                                className="text-blue-600 cursor-pointer hover:text-blue-800"
                                size={20}
                                onClick={() => handleSocialClick('facebook')}
                            />
                            <FaInstagram
                                className="text-pink-500 cursor-pointer hover:text-pink-700"
                                size={20}
                                onClick={() => handleSocialClick('instagram')}
                            />
                            <FaTwitter
                                className="text-blue-400 cursor-pointer hover:text-blue-600"
                                size={20}
                                onClick={() => handleSocialClick('twitter')}
                            />
                            <FaWhatsapp
                                className="text-green-500 cursor-pointer hover:text-green-700"
                                size={20}
                                onClick={() => handleSocialClick('whatsapp')}
                            />
                            <FaLinkedin
                                className="text-blue-500 cursor-pointer hover:text-blue-700"
                                size={20}
                                onClick={() => handleSocialClick('linkedin')}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleShareLink}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition duration-300 w-full sm:w-auto"
                    >
                        Copy Link
                    </button>
                    <Link href="/seller/gigs/create" passHref>
                        <button className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition duration-300 w-full sm:w-auto">
                            Create New Offer
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gigs.map(({ title, category, price, deliveryTime, timeUnit, id }) => (
                    <div key={id} className="bg-gray-50 shadow-md rounded-lg p-4 transition-transform transform hover:scale-105">
                        <h4 className="text-md sm:text-lg md:text-xl font-bold mb-2">{title}</h4>
                        <p className="text-sm sm:text-base text-gray-600 mb-1"><strong>Category:</strong> {category}</p>
                        <p className="text-sm sm:text-base text-gray-600 mb-1"><strong>Price:</strong> ₦{price}</p>
                        <p className="text-sm sm:text-base text-gray-600 mb-1"><strong>Delivery Time:</strong> {deliveryTime}</p>
                        <p className="text-sm sm:text-base text-gray-600 mb-1"><strong>Duration:</strong> {pluralizeTimeUnit(deliveryTime, timeUnit)}</p>
                        <div className="flex justify-between items-center mt-4">
                            <span
                                className="text-sm sm:text-base text-gray-600 underline hover:text-gray-800 cursor-pointer transition duration-300"
                                onClick={() => router.push('/settings')}
                            >
                                More
                            </span>
                            <Link href={`/seller/gigs/${id}`} passHref>
                                <button className="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    Edit
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <MobileBottomNav />
        </div>
    );
}

export default Index;
