const isValidEmail = (email) => {
    // Simple regular expression for basic email validation
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

{/*
const isValidPassword = (password) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Minimum eight characters, at least one letter and one number
    return re.test(String(password));
};
*/}

const isValidPassword = (password) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/; // Minimum eight characters, at least one letter and one number, special character is accepted
    return re.test(String(password));
};

{/*
const isValidPassword = (password) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Minimum eight characters, at least one letter and one number and special character
    return re.test(String(password));
};
*/}



export const signUp = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Email and password are required.");
    }

    // Validate the email format
    if (!isValidEmail(email)) {
        return res.status(400).send("Please enter a valid email.");
    }

    if (!isValidPassword(password)) { // Implement this function
        return res.status(400).send("Your password must be at least 8 characters long, containing at least one letter and one number.");
    }

    try {
        const lowerCaseEmail = email.toLowerCase();

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: lowerCaseEmail },
        });

        if (existingUser) {
            return res.status(400).send("An account with this email already exists.");
        }

        const hashedPassword = await generatePassword(password);
        const user = await prisma.user.create({
            data: {
                email: lowerCaseEmail,
                password: hashedPassword,
            },
        });

        const token = createToken(lowerCaseEmail, user.id);
        await sendConfirmationEmail(lowerCaseEmail, user.id); // Send confirmation email after successful signup

        res.status(201).json({
            user: { id: user.id, email: user.email },
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (email && password) {
            const lowerCaseEmail = email.toLowerCase();
            const user = await prisma.user.findUnique({
                where: { email: lowerCaseEmail },
            });
            if (!user) {
                return res.status(400).send("User not found.");
            }
            const auth = await compare(password, user.password);

            if (!auth) {
                return res.status(400).send("Incorrect password, try again!.");
            }

            return res
                .status(200)
                .json({
                    user: { id: user.id, email: user.email },
                    jwt: createToken(lowerCaseEmail, user.id),
                });
        }
        return res.status(400).send("Email and Password Required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");

    }
};
