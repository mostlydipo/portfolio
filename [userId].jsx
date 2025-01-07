import axios from "axios";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { HOST } from "@/utils/constants";
import { GET_PUBLIC_USER_GIGS_ROUTE } from "@/utils/constants";

function PublicGigs() {
    const router = useRouter();
    const { userId } = router.query;
    const [gigs, setGigs] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const fetchPublicUserGigs = async () => {
            setLoading(true);
            setError(null);
            try {
                const {
                    data: { gigs: userGigs, user: userData },
                } = await axios.get(GET_PUBLIC_USER_GIGS_ROUTE.replace(":userId", userId));
                setGigs(userGigs);
                setUser(userData);
            } catch (err) {
                setError("Failed to load gigs.");
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicUserGigs();
    }, [userId]);

    const handleGigClick = (gigId) => {
        router.push(`/gig/${gigId}`);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="min-h-[80vh] my-6 px-4 sm:px-6 lg:px-8">
            {/* User Information Section */}
            <div className="bg-gradient-to-r from-green-100 via-white to-green-50 p-6 rounded-lg shadow-lg mb-8 flex flex-col lg:flex-row items-center lg:items-start justify-between space-y-4 lg:space-y-0">
                {/* Text Section */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <h1 className="text-2xl font-extrabold text-gray-800">
                        {user?.fullName || user?.username}
                    </h1>
                    {user?.description && (
                        <p className="text-gray-700 mt-4 text-base leading-relaxed">
                            <i className="fas fa-user-circle text-green-600"></i> {user.description}
                        </p>
                    )}
                </div>

                {/* Image Section */}
                <div className="lg:ml-auto lg:mt-0">
                    {user?.profileImage ? (
                        <Image
                            src={`${HOST}/${user.profileImage}`}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="rounded-full object-cover mx-auto lg:mx-0"
                        />
                    ) : (
                        <div className="flex items-center justify-center bg-green-500 text-white rounded-full w-20 h-20 text-xl font-bold">
                            {user?.email[0].toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Gigs Section */}
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center sm:text-left">Available Offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gigs.map(({ title, category, price, deliveryTime, timeUnit, id }) => (
                    <div
                        key={id}
                        className="relative bg-gray-50 shadow-md rounded-lg p-4 transition-transform transform hover:scale-105 cursor-pointer"
                        onClick={() => handleGigClick(id)}
                    >
                        {/* Folded Corner */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 border-transparent border-t-white border-r-white"></div>

                        <h4 className="text-lg font-bold text-gray-800 mb-2">{title}</h4>
                        <p className="text-sm text-gray-600 mb-1">
                            <strong>Category:</strong> {category}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                            <strong>Price:</strong> ₦{price}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                            <strong>Delivery Time:</strong> {deliveryTime} {timeUnit}
                        </p>

                        {/* Find Out More Button */}
                        <button
                            className="absolute bottom-4 right-4 bg-green-900 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-900 transition"
                            onClick={() => handleGigClick(id)}
                        >
                            Find Out More
                        </button>
                    </div>

                ))}
            </div>
        </div>
    );

}

export default PublicGigs;
