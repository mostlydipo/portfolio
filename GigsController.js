//import { PrismaClient } from "@prisma/client";
import { prisma } from './prismaInstance.js';
import { existsSync, renameSync, unlinkSync } from 'fs';
import { subMonths } from 'date-fns'; // Import date-fns to subtract months

export const addGig = async (req, res, next) => {
    try {
        // Fetch the user data to check the profile and email confirmation status
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            }
        });

        // Check if the user's profile information is set and email is confirmed
        if (!user.isProfileInfoSet && !user.isEmailConfirmed) {
            return res.status(403).json({ error: "Profile information must be set and email must be confirmed to add a work." });
        }
        if (!user.isProfileInfoSet) {
            return res.status(403).json({ error: "Profile information must be set to add a work." });
        }
        if (!user.isEmailConfirmed) {
            return res.status(403).json({ error: "Email must be confirmed to add a work." });
        }

        // Fetch the count of gigs created by this user
       const userGigCount = await prisma.gigs.count({
            where: {
                userId: req.userId,
                deleted: false  // Exclude deleted gigs
            }
        });

        // Check if the user has already created 5 gigs
        if (userGigCount >= 5) {
            return res.status(403).json({ error: "You have reached the maximum limit of 5 works." });
        }

        // Check if a gig with the same title already exists for this user
        const { title, description, category, features, price, revisions, time, timeUnit, shortDesc, city, state, downPayment, quotationReason, quotationDetails } = req.query;

        const existingGig = await prisma.gigs.findFirst({
            where: {
                title,
                userId: req.userId // Ensure the gig belongs to the current user
            }
        });

        if (existingGig) {
            return res.status(400).json({ error: "You already have a work with this title." });
        }

        if (req.files) {
            const fileKeys = Object.keys(req.files);
            const fileNames = [];
            fileKeys.forEach((file) => {
                const date = Date.now();
                renameSync(
                    req.files[file].path,
                    "uploads/" + date + req.files[file].originalname
                );
                fileNames.push(date + req.files[file].originalname);
            });
            if (req.query) {
                const {
                    title,
                    description,
                    category,
                    features,
                    price,
                    revisions,
                    time,
                    timeUnit,
                    shortDesc,
                    city,
                    state,
                    downPayment,
                    quotationReason,
                    quotationDetails
                } = req.query;


                //const prisma = new PrismaClient();

                await prisma.gigs.create({
                    data: {
                        title,
                        description,
                        deliveryTime: parseInt(time),
                        category,
                        features,
                        timeUnit,
                        price: parseInt(price),
                        shortDesc,
                        city,
                        state,
                        revisions: parseInt(revisions),
                        downPayment: downPayment === 'yes',
                        quotationReason: downPayment === 'yes' ? quotationReason : null,
                        quotationDetails: downPayment === 'yes' ? JSON.parse(quotationDetails) : null,
                        createdBy: { connect: { id: req.userId } },
                        images: fileNames,
                    },
                });

                return res.status(201).send("Succcessfully created work.");
            }
        }
        return res.status(400).send("All properties should be required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};

export const getUserAuthGigs = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: {
                gigs: {
                    where: { deleted: false }, // Exclude deleted gigs
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return both gigs and user information
        return res.status(200).json({
            gigs: user.gigs,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email, // Include other user fields as needed
            },
        });
    } catch (err) {
        console.error("Error fetching user and gigs:", err);
        return res.status(500).send("Internal server error");
    }
};


export const getPublicUserGigs = async (req, res, next) => {
    console.log("Request received for public gigs:", req.params.userId); // Log the user ID
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Convert userId to an integer
        const parsedUserId = parseInt(userId, 10);

        if (isNaN(parsedUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id: parsedUserId },
            include: {
               gigs: {
                    where: {
                        deleted: false, // Exclude deleted gigs
                        visibility: true, // Exclude gigs where visibility is false
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure the response includes both `gigs` and `user` details
        return res
            .status(200)
            .json({
                gigs: user.gigs,
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    description: user.description, // Include description
                    profileImage: user.profileImage,
                    email: user.email,
                }
            });
    } catch (err) {
        console.error("Error fetching public user gigs:", err);
        return res.status(500).send("Internal server error");
    }
};
export const getGigData = async (req, res, next) => {
    try {
        if (req.params.gigId) {
            //const prisma = new PrismaClient();
            const gig = await prisma.gigs.findUnique({
                where: { id: parseInt(req.params.gigId) },
                include: {
                    createdBy: true,
                    reviews: {
                        include: { reviewer: true },
                        take: 5, // Limit to 5 reviews
                        orderBy: { createdAt: 'desc' } // Optional: Order reviews by creation date
                    }
                },
            });
            
           if (!gig) {
                return res.status(404).json({ error: "Gig not found" });
            }

            const totalReviews = gig.reviews.length;

            const averageRating = totalReviews > 0
                ? (
                    gig.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
                ).toFixed(1)
                : 0;

            // Fetch all gigs created by the user
            const gigsUser = await prisma.gigs.findMany({
                where: { userId: gig.createdBy.id },
                include: {
                    reviews: true,
                },
            });

            const totalUserReviews = gigsUser.reduce(
                (acc, userGig) => acc + userGig.reviews.length,
                0
            );

            const averageUserRating = totalUserReviews > 0
                ? (
                    gigsUser.reduce(
                        (acc, userGig) => acc + userGig.reviews.reduce((sum, review) => sum + review.rating, 0),
                        0
                    ) / totalUserReviews
                ).toFixed(1)
                : 0;

            return res
                .status(200)
                .json({
                    gig: {
                        ...gig,
                        totalReviews,
                        averageRating,
                        totalUserReviews,
                        averageUserRating,
                         downPayment: gig.downPayment // Include downPayment flag in the response
                    }
                });
        }
        return res.status(400).send("Gig ID is required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};


export const getMoreReviews = async (req, res, next) => {
    try {
        if (req.params.gigId && req.query.page) {
            const page = parseInt(req.query.page);
            const limit = 5; // Number of reviews per page
            const offset = (page - 1) * limit;

            const reviews = await prisma.reviews.findMany({
                where: { gigId: parseInt(req.params.gigId) },
                include: { reviewer: true },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' } // Optional: Order reviews by creation date
            });

            return res.status(200).json({ reviews, page });
        }
        return res.status(400).send("GigId and page are required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};


export const editGig = async (req, res, next) => {
    try {
         // Find the gig first to check associated orders
         const gigId = parseInt(req.params.gigId);

        // Fetch the gig along with related orders and refund requests
       const gig = await prisma.gigs.findUnique({
            where: { id: gigId },
            include: {
                orders: {
                    include: { RefundRequest: true }
                }
            }
        });

       if (!gig) {
            return res.status(404).json({ error: "Work not found" });
        }

       // Check if the gig can be edited
        const canEdit = gig.orders.every(order => 
            // Only consider orders where isCompleted is true
            !order.isCompleted || (
                // If isCompleted is true, then:
                order.mutualCompleted ||  // The order must be mutually completed
                // Or all refund requests must be completed
                (order.RefundRequest.every(refund => refund.status === "completed"))
            )
        );

        if (!canEdit) {
            return res.status(400).json({ error: "Cannot edit work with outstanding orders or incomplete refunds." });
        }

         const { title, description, category, features, price, revisions, time, timeUnit, shortDesc, city, state, downPayment, quotationReason, quotationDetails } = req.query;

        // Check if a gig with the same title already exists for this user (excluding the current gig being edited)
        const existingGig = await prisma.gigs.findFirst({
            where: {
                title,
                userId: req.userId, // Ensure the gig belongs to the current user
                id: {
                    not: gigId // Exclude the current gig being edited
                }
            }
        });

        if (existingGig) {
            return res.status(400).json({ error: "You already have a work with this title." });
        }


        if (req.files) {
            const fileKeys = Object.keys(req.files);
            const fileNames = [];
            fileKeys.forEach((file) => {
                const date = Date.now();
                renameSync(
                    req.files[file].path,
                    "uploads/" + date + req.files[file].originalname
                );
                fileNames.push(date + req.files[file].originalname);
            });
            if (req.query) {
                const {
                    title,
                    description,
                    category,
                    features,
                    price,
                    revisions,
                    time,
                    timeUnit,
                    shortDesc,
                    city,
                    state,
                    downPayment,
                    quotationReason,
                    quotationDetails
                } = req.query;


                //const prisma = new PrismaClient();
                const oldData = await prisma.gigs.findUnique({
                    where: { id: parseInt(req.params.gigId) },
                });

                await prisma.gigs.update({
                    where: { id: parseInt(req.params.gigId) },
                    data: {
                        title,
                        description,
                        deliveryTime: parseInt(time),
                        category,
                        timeUnit,
                        features,
                        price: parseInt(price),
                        shortDesc,
                        city,
                        state,
                        revisions: parseInt(revisions),
                        downPayment: downPayment === 'yes',
                        quotationReason: downPayment === 'yes' ? quotationReason : null,
                        quotationDetails: downPayment === 'yes' ? JSON.parse(quotationDetails) : null,
                        createdBy: { connect: { id: req.userId } },
                        images: fileNames,
                    },
                });

                oldData?.images.forEach((image) => {
                    if (existsSync(`uploads/${image}`)) unlinkSync(`uploads/${image}`);
                });

                return res.status(200).json({ message: "Successfully edited work." });
            }
        }
        return res.status(400).json({ message: "All properties should be required." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const searchGigs = async (req, res, next) => {
    try {
        const { searchTerm, category, minBudget, maxBudget, minTime, maxTime, city, state, fromDate, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;
        //const prisma = new PrismaClient();
        const query = {
            where: {
                AND: [
                    { visibility: true }, // Only show visible gigs
                    { deleted: false }, // Exclude deleted gigs
                     { id: { not: 3 } },    // Explicitly exclude gig ID 3
                    searchTerm ? {
                        title: { contains: searchTerm, mode: 'insensitive' },
                    } : {},
                    category ? {
                        category: { equals: category },
                    } : {},
                    minBudget ? {
                        price: { gte: parseInt(minBudget) },
                    } : {},
                    maxBudget ? {
                        price: { lte: parseInt(maxBudget) },
                    } : {},
                    minTime ? {
                        deliveryTime: { gte: parseInt(minTime) },
                    } : {},
                    maxTime ? {
                        deliveryTime: { lte: parseInt(maxTime) },
                    } : {},
                    city ? {
                        city: { equals: city, mode: 'insensitive' },  // Add city filter
                    } : {},
                    state ? {
                        state: { equals: state, mode: 'insensitive' }  // Add state filter
                    } : {},
                    fromDate ? {
                        createdAt: { gte: new Date(fromDate) } // Add recency filter
                    } : {}
                ].filter(obj => Object.keys(obj).length > 0)
            },
            include: {
                createdBy: true,
                reviews: {
                    include: {
                        reviewer: true
                    }
                }
            },
            skip: offset,
            take: parseInt(limit),
            orderBy: {
                createdAt: 'desc' // Order by latest gigs first
            }
        };

        // Get total count for pagination metadata
        const total = await prisma.gigs.count({
            where: query.where
        });

        console.log(req.query.category);
        const gigs = await prisma.gigs.findMany(query);
        return res.status(200).json({ gigs, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};



export const checkGigOrder = async (req, res, next) => {
    try {
        if (req.userId && req.params.gigId) {
            const hasUserOrderedGig = await checkOrder(req.userId, req.params.gigId);
            return res
                .status(200)
                .json({ hasUserOrderedGig: hasUserOrderedGig ? true : false });
        }
        return res.status(400).send("userId and gigId is required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

const checkOrder = async (userId, gigId) => {
    try {
        //const prisma = new PrismaClient();
        const hasUserOrderedGig = await prisma.orders.findFirst({
            where: {
                buyerId: parseInt(userId),
                gigId: parseInt(gigId),
                isCompleted: true,
            },
        });
        return hasUserOrderedGig;
    } catch (err) {
        console.log(err);
    }
};

export const addReview = async (req, res, next) => {
    try {
        if (req.userId && req.params.gigId) {
            if (await checkOrder(req.userId, req.params.gigId)) {
                if (req.body.reviewText && req.body.rating) {
                    //const prisma = new PrismaClient();
                    const newReview = await prisma.reviews.create({
                        data: {
                            rating: req.body.rating,
                            reviewText: req.body.reviewText,
                            reviewer: { connect: { id: parseInt(req.userId) } },
                            gig: { connect: { id: parseInt(req.params.gigId) } },
                        },
                        include: {
                            reviewer: true,
                        },
                    });
                    return res.status(201).json({ newReview });
                }
                return res.status(400).send("ReviewText and Rating are required.");
            }
            return res
                .status(400)
                .send("You need to purchase the gig in order to add review.");
        }
        return res.status(400).send("userId and gigId is required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

// In controller.js
export const updateGigVisibility = async (req, res) => {
    try {
        const { gigId, visibility } = req.body;
        const updatedGig = await prisma.gigs.update({
            where: { id: parseInt(gigId) },
            data: { visibility: visibility },
        });
        return res.status(200).json({ message: 'Gig visibility updated', gig: updatedGig });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};

export const deleteGig = async (req, res) => {
    const { gigId } = req.params;
    try {
        const gig = await prisma.gigs.findUnique({
            where: { id: parseInt(gigId) },
            include: { orders: { include: { RefundRequest: true } } } // Include RefundRequest in the order query
        });

        if (!gig) {
            return res.status(404).send("Work not found");
        }

        if (gig.userId !== req.userId) {
            return res.status(403).send("Unauthorized");
        }


      const hasPendingOrders = gig.orders.some(order => 
    order.isCompleted && (  // Only check if the order is completed
        (
            // Case 1: If mutualCompleted is false, check that all refund requests are completed for deletion
            !order.mutualCompleted && 
            (!order.RefundRequest || order.RefundRequest.every(refund => refund.status === "completed"))
        ) ||
        // Case 2: If mutualCompleted is true, allow deletion if no refund requests are marked as "completed"
        (order.mutualCompleted && 
            (!order.RefundRequest || order.RefundRequest.every(refund => refund.status !== "completed"))
        )
    )
);

// If `hasPendingOrders` is false, then the gig can be deleted.
if (!hasPendingOrders) {
    // Proceed with gig deletion logic
}

        // Step 1: Delete related QuickMessages
        await prisma.quickMessage.deleteMany({
            where: { gigId: parseInt(gigId) }
        });

        if (gig.orders.length > 0) {
            // Soft delete if there are associated orders
            await prisma.gigs.update({
                where: { id: parseInt(gigId) },
                data: { deleted: true }
            });
        } else {
            // Permanently delete if no orders
            await prisma.gigs.delete({
                where: { id: parseInt(gigId) }
            });
        }

        return res.status(200).send("Work deleted successfully");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal server error");
    }
};

export const getAllGigs = async (req, res, next) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        const total = await prisma.gigs.count({
            where: {
                visibility: true,  // Only show visible gigs
                deleted: false,    // Exclude deleted gigs
                userId: { not: req.userId }, // Exclude gigs created by the user
                id: { not: 3 } // Exclude gig with ID 3
            }
        });

        const gigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                userId: { not: req.userId }, // Exclude gigs created by the user
                id: { not: 3 } // Exclude gig with ID 5
            },
            include: {
                createdBy: true,
                reviews: {
                    include: {
                        reviewer: true
                    }
                }
            },
            skip: offset,
            take: parseInt(limit),
            orderBy: {
                createdAt: 'desc' // Order by latest gigs first
            }
        });

        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({ gigs, total, page: parseInt(page), totalPages });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};

export const getNonUserGigs = async (req, res, next) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        const total = await prisma.gigs.count({
            where: {
                visibility: true,
                deleted: false,
                id: { not: 3 } // Exclude gig with ID 3
            }
        });

        const gigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                id: { not: 3 } // Exclude gig with ID 5
            },
            include: {
                createdBy: true,
                reviews: {
                    include: {
                        reviewer: true
                    }
                }
            },
            skip: offset,
            take: parseInt(limit),
            orderBy: {
                createdAt: 'desc' // Order by latest gigs first
            }
        });

        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({ gigs, total, page: parseInt(page), totalPages });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};


export const getRandomGigs = async (req, res, next) => {
    try {
        const { limit = 60 } = req.query;

        // Get a count of total gigs that match the criteria
        const total = await prisma.gigs.count({
            where: {
                visibility: true,
                deleted: false,
                id: { not: 3 } // Exclude gig with ID 5
            }
        });

        // Fetch gigs without ordering randomly
        const allGigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                id: { not: 3 } // Exclude gig with ID 5
            },
            include: {
                createdBy: true,
                reviews: {
                    include: {
                        reviewer: true
                    }
                }
            }
        });

        // Shuffle the gigs array in JavaScript
        const shuffledGigs = allGigs.sort(() => Math.random() - 0.5).slice(0, limit);

        return res.status(200).json({ gigs: shuffledGigs, total });
    } catch (err) {
        console.error('Error fetching random gigs:', err);
        return res.status(500).send("Internal server error");
    }
};

export const getRecentlyPostedGigs = async (req, res, next) => {
    try {
        const oneMonthsAgo = subMonths(new Date(), 1); // Get the date 3 months ago

        // Fetch all recent gigs
        const recentGigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                createdAt: {
                    gte: oneMonthsAgo, // Fetch gigs posted within the last 3 months
                }
            },
            include: {
                createdBy: true,
            },
            orderBy: {
                createdAt: 'desc', // Order by latest gigs first
            },
        });

        // Fetch recent gigs in the "Software Developer" and "Data & AI" categories
        const softwareDevGigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                createdAt: {
                    gte: oneMonthsAgo, // Fetch gigs posted within the last 3 months
                },
                OR: [
                    { category: "Software Developer" },
                    { category: "Data & AI" }
                ],
            },
            include: {
                createdBy: true,
            },
            orderBy: {
                createdAt: 'desc', // Order by latest gigs first
            },
        });

        // Fetch recent gigs in the "Photography", "Digital Marketing", and "Writing & Translation" categories
        const professionalGigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                createdAt: {
                    gte: oneMonthsAgo, // Fetch gigs posted within the last 3 months
                },
                OR: [
                    { category: "Photography" },
                    { category: "Digital Marketing" },
                    { category: "Writing & Translation" }
                ],
            },
            include: {
                createdBy: true,
            },
            orderBy: {
                createdAt: 'desc', // Order by latest gigs first
            },
        });

        // Fetch recent gigs in the "Creative" categories
        const creativeGigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                createdAt: {
                    gte: oneMonthsAgo, // Fetch gigs posted within the last 3 months
                },
                OR: [
                    { category: "Design & Creative" },
                    { category: "Video & Animation" },
                    { category: "Music & Audio" },
                    { category: "Decoration" },
                    { category: "Fashion & Beauty" },
                ],
            },
            include: {
                createdBy: true,
            },
            orderBy: {
                createdAt: 'desc', // Order by latest gigs first
            },
        });

        // Fetch recent gigs in the "Artisan" categories
        const artisanGigs = await prisma.gigs.findMany({
            where: {
                visibility: true,
                deleted: false,
                createdAt: {
                    gte: oneMonthsAgo, // Fetch gigs posted within the last 3 months
                },
                OR: [
                    { category: "Handyman" },
                    { category: "Builders" }
                ],
            },
            include: {
                createdBy: true,
            },
            orderBy: {
                createdAt: 'desc', // Order by latest gigs first
            },
        });

        return res.status(200).json({ recentGigs, softwareDevGigs, professionalGigs, creativeGigs, artisanGigs });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
};
