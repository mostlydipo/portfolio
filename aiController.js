// controllers/aiController.js

import openai from "../openaiConfig.js"; // Import the OpenAI client correctly
import { prisma } from './prismaInstance.js';

export const getFreelancerRecommendations = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || prompt.length < 5) {
        return res.status(400).json({ error: "Please provide a more detailed description." });
    }

    try {
        // Improve the AI prompt to avoid metadata and extra formatting in the response
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a smart assistant that extracts useful search keywords from client requests. The request may be about finding gigs or freelancers. Focus only on the key words such as the city, state, services, or price, without adding any labels like "Location:", "Skills:", etc.`,
                },
                {
                    role: "user",
                    content: `Client Request: "${prompt}". Extract only the useful search keywords for city, state, service type, and price.`,
                },
            ],
            max_tokens: 50,
            temperature: 0.7,
        });

        // Log the full AI response object for debugging
        console.log("Full AI Response:", aiResponse);

        // Extract the keywords from the AI response
        const keywordsText = aiResponse?.choices?.[0]?.message?.content || "";

        // Log the raw keywords text
        console.log("Keywords Text:", keywordsText);

        // Step 1: Clean up the AI response by removing any unwanted characters
        const cleanedKeywordsText = keywordsText
            .replace(/\(.*?\)/g, '') // Remove text in parentheses
            .replace(/[-:*]/g, '')   // Remove dashes, colons, and asterisks
            .replace(/\n/g, ',')     // Replace newlines with commas
            .split(',')
            .map((kw) => kw.trim())  // Trim whitespace
            .filter((kw) => kw.length > 0); // Filter out empty strings

        console.log("Cleaned Keywords:", cleanedKeywordsText);

        // Step 2: Build search conditions based on the cleaned keywords
        const gigConditions = [];
        const userConditions = [];

        let cityConditions = [];
        let stateConditions = [];

        cleanedKeywordsText.forEach(keyword => {
            const price = parseInt(keyword);
            if (!isNaN(price)) {
                gigConditions.push({ price: { gte: price } });
            }

            // Use keywords for city/state matching
            if (keyword) {
                cityConditions.push({ city: { contains: keyword, mode: 'insensitive' } });
                stateConditions.push({ state: { contains: keyword, mode: 'insensitive' } });
            }

            // Search for title/description in Gigs
            gigConditions.push({ title: { contains: keyword, mode: 'insensitive' } });
            gigConditions.push({ description: { contains: keyword, mode: 'insensitive' } });
            gigConditions.push({ shortDesc: { contains: keyword, mode: 'insensitive' } });

            // Search for features in Gigs (this field is an array)
            gigConditions.push({ features: { has: keyword } });

            // Search by user full name and username in Users
            if (/\s/.test(keyword)) {
                // If the keyword looks like a full name (contains spaces)
                userConditions.push({ fullName: { contains: keyword, mode: 'insensitive' } });
            } else {
                // If the keyword looks like a username (no spaces)
                userConditions.push({ username: { contains: keyword, mode: 'insensitive' } });
            }

            // Search by user description
            userConditions.push({ description: { contains: keyword, mode: 'insensitive' } });
        });

        // Step 3: Ensure city or state (or both) can match, but they are independent of each other
        gigConditions.push({
            OR: [
                { OR: cityConditions },
                { OR: stateConditions }
            ]
        });

        // Step 4: Query the database for matching Gigs and Users
        const matchingGigs = await prisma.gigs.findMany({
            where: {
                OR: gigConditions,
                visibility: true,
                deleted: false,
            },
            include: {
                createdBy: true, // Include the user who created the gig
            },
        });

        const matchingUsers = await prisma.user.findMany({
            where: {
                OR: userConditions,
            },
            include: { gigs: true }, // Include the gigs the user has created
        });

        // Step 5: Return the results
        res.json({
            gigs: matchingGigs,
            users: matchingUsers,
        });
    } catch (error) {
        console.error("Error in getFreelancerRecommendations:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};



// New function to handle conversational AI
export const converseWithAI = async (req, res) => {
    const { conversation } = req.body; // The conversation is an array of messages

    if (!conversation || conversation.length === 0) {
        return res.status(400).json({ error: "Conversation history is required." });
    }

    try {
        // Call OpenAI API with the entire conversation history
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: conversation, // Pass the full conversation history
            max_tokens: 100, // Limit the response length
            temperature: 0.7,
        });

        // Get the AI's response
        const aiMessage = aiResponse?.choices?.[0]?.message?.content || "Sorry, I couldn't understand that.";

        // Send the response back to the frontend
        res.json({ message: aiMessage });
    } catch (error) {
        console.error("Error in converseWithAI:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

// Controller for creating gig descriptions
export const createGigDescription = async (req, res) => {
    const { prompt } = req.body;

    try {
        // Generate a gig description using ChatGPT
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an assistant that helps freelancers create gig descriptions.",
                },
                {
                    role: "user",
                    content: `Help me create a gig description based on the following details:\n\n${prompt}\n\nGig Description:`,
                },
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        const gigDescription = aiResponse.choices[0].message.content.trim();

        // Send the generated gig description
        res.json({ gigDescription });
    } catch (error) {
        console.error("Error in createGigDescription:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
