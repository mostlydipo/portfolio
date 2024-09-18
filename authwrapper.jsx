import { useStateProvider } from '@/context/StateContext';
import { reducerCases } from "@/context/constants";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from '@/utils/constants';
import axios from 'axios';
import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import { FaTimes } from "react-icons/fa";
import Link from 'next/link';

function AuthWrapper({ type }) {
    const [cookies, setCookies] = useCookies();
    const [{ showLoginModal, showSignupModal }, dispatch] = useStateProvider();
    const [values, setValues] = useState({ email: "", password: "" });
    const [error, setError] = useState("");  // State to store error message
    const [signupSuccess, setSignupSuccess] = useState("");
    const [resetPasswordMessage, setResetPasswordMessage] = useState(""); // New state for reset password message
    const [agreedToTerms, setAgreedToTerms] = useState(false); // New state for agreement checkbox
    const [rememberMe, setRememberMe] = useState(false);  // Add Remember Me state

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleClick = async () => {
        try {
            setError("");  // Clear previous errors
            setSignupSuccess("");  // Clear previous signup messages
            setResetPasswordMessage("");

            if (type === "signup" && !agreedToTerms) {
                setError("You must agree to the Privacy Policy and Terms of Use to sign up.");
                return;
            }

            const { email, password } = values;
            if (!email || !password) {
                setError("Email and password are required");
                return;
            }

            const response = await axios.post(
                type === "login" ? LOGIN_ROUTE : SIGNUP_ROUTE,
                { email, password },
                { withCredentials: true }
            );

            if (type === "signup") {
                setSignupSuccess("Account created! please follow the link in your Email/spam folder to login.");
            } else {
                // Process login with Remember Me option
                const cookieOptions = { path: '/' };
                if (rememberMe) {
                    cookieOptions.maxAge = 30 * 24 * 60 * 60; // 30 days
                }
                setCookies('jwt', response.data.jwt, cookieOptions);
                dispatch({ type: reducerCases.SET_USER, userInfo: response.data.user });
                dispatch({ type: reducerCases.CLOSE_AUTH_MODEL });
                window.location.reload();  // Reload the window to reflect login state change
            }
    } catch (err) {
        if (err.response && err.response.data) {
            setError(err.response.data); // Use server response for error
        } else {
            setError("An error occurred, please try again.");
        }
    }
};

   const handleForgotPassword = async () => {
        setError("");  // Clear previous errors
        setResetPasswordMessage("");  // Clear previous reset messages

    if (!values.email) {
        setError("Email is required to reset password.");
        return;
    }

    try {
        const lowerCaseEmail = values.email.toLowerCase(); // Ensure email is in lowercase
        await axios.post('https://wkmanship-hc4fj.kinsta.app/api/auth/forgot-password', { email: lowerCaseEmail });
        setResetPasswordMessage("If the email is associated with an account, a reset link has been sent.");
    } catch (error) {
            if (error.response && error.response.status === 404) {
                setError("No user found with that email.");  // Handle specific error
            } else {
                setError("Failed to send reset link.");
            }
        }
    };

    const handleClose = () => {
        dispatch({ type: reducerCases.CLOSE_AUTH_MODEL });
    };

     // New function to handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleClick();  // Trigger continue action when Enter is pressed
        }
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full z-[100] flex justify-center items-center">
            <div
                className="h-full w-full backdrop-blur-md fixed top-0 left-0"
                id="blur-div"
                onClick={handleClose}  // Close modal when clicking outside
            ></div>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg z-[101] w-full max-w-md mx-4">
                <div className="flex justify-end">
                    <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={handleClose}
                    >
                        <FaTimes size="1.5em" />
                    </button>
                </div>
                <div className="flex flex-col justify-center items-center gap-7">
                    <h3 className="text-2xl font-semibold text-gray-700">
                        {type === "login" ? "Log in to Wkmanship" : "Sign up to WKmanship"}
                    </h3>
                    {signupSuccess && <div className="text-green-700 text-sm px-2 break-words max-w-xs">{signupSuccess}</div>}
                    {resetPasswordMessage && <div className="text-green-700 text-sm px-2 break-words max-w-xs">{resetPasswordMessage}</div>}
                    {error && <div className="text-red-500">{error}</div>}  {/* Display error message */}
                    <div className="flex flex-col gap-5 w-full">
                        <input
                            type="text"
                            name="email"
                            placeholder="Email"
                            className="border border-slate-300 p-3 w-full rounded-md"
                            value={values.email}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}  // Add keydown event listener
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="border border-slate-300 p-3 w-full rounded-md"
                            value={values.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}  // Add keydown event listener
                        />

                         {/* Password requirements for signup */}
    {type === "signup" && (
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Your password must be a minimum of 8 characters, and contain at least one number.
        </p>
    )}

                        {/* Remember Me Checkbox */}
                        {type === "login" && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    className="mr-2"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                <label htmlFor="rememberMe" className="text-sm text-gray-700">Always sign me in</label>
                            </div>
                        )}
                        
                        {type === "signup" && (
                            <div className="flex items-start mt-2">
                                <input
                                    type="checkbox"
                                    id="agree"
                                    className="mt-1"
                                    checked={agreedToTerms}
                                    onChange={() => setAgreedToTerms(!agreedToTerms)}
                                />
                                <label htmlFor="agree" className="ml-2 text-sm text-gray-700">
                                    I have read, understood, and I agree to Wkmanship's{" "}
                                    <a href="/privacyPolicy" target="_blank" rel="noopener noreferrer" className="text-[#1DBF73] hover:underline">
                                        Privacy Policy
                                    </a>{" "}
                                    and{" "}
                                    <a href="/termsOfUse" target="_blank" rel="noopener noreferrer" className="text-[#1DBF73] hover:underline">
                                        Terms of Use
                                    </a>
                                </label>
                            </div>
                        )}
                        <button
                            className="text-slate-600 text-sm hover:text-slate-800 self-start"
                            onClick={handleForgotPassword}
                        >
                            Forgot Password?
                        </button>
                        <button
                            className="bg-[#1DBF73] text-white px-12 text-lg font-semibold rounded-md p-3 w-full"
                            onClick={handleClick}>
                            Continue
                        </button>
                    </div>
                </div>
                <div className="py-5 w-full flex items-center justify-center border-t border-slate-400">
                    <span className="text-sm text-slate-700">
                        {type === "login" ? (
                            <>
                                Not a member yet?{" "}
                                <span className="text-[#1DBF73] cursor-pointer font-bold"
                                    onClick={() => {
                                        setError(""); // Clear any previous error message
                                        dispatch({
                                            type: reducerCases.TOGGLE_LOGIN_MODAL,
                                            showLoginModal: false,
                                        });
                                        dispatch({
                                            type: reducerCases.TOGGLE_SIGNUP_MODAL,
                                            showSignupModal: true,
                                        });
                                    }}
                                >
                                    Join Now
                                </span>
                            </>
                        ) : (
                            <>
                                Already a member?{" "}
                                <span className="text-[#1DBF73] cursor-pointer font-bold"
                                    onClick={() => {
                                        setError(""); // Clear any previous error message
                                        dispatch({
                                            type: reducerCases.TOGGLE_SIGNUP_MODAL,
                                            showSignupModal: false,
                                        });
                                        dispatch({
                                            type: reducerCases.TOGGLE_LOGIN_MODAL,
                                            showLoginModal: true,
                                        });
                                    }}
                                >
                                    Login Now
                                </span>
                            </>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AuthWrapper;
