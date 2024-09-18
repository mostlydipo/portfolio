import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send("Authentication token is missing or incorrectly formatted");
    }
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "TokenExpired" });
            }
            return res.status(403).send("Token is not valid or has expired");
        }
        req.userId = payload?.userId;
        next();
    });
};
