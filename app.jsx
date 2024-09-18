import Footer from "@/components/Footer";
import Navbar from "@/components/landing/Navbar";
import { StateProvider, useStateProvider } from "@/context/StateContext";
import reducer, { initialState } from "@/context/StateReducers";
import "@/styles/globals.css";
import Head from "next/head";
import SplashScreen from "@/components/SplashScreen";
import { useRouter } from "next/router";
import { useEffect, useState } from "react"; // useState added here
import { useCookies } from "react-cookie";
import AuthWrapper from "@/components/AuthWrapper";
import axios from "axios"; // new#
import { reducerCases } from "@/context/constants";

function MainComponent({ Component, pageProps }) {
    const [{ showLoginModal, showSignupModal, userInfo }, dispatch] = useStateProvider();
    const router = useRouter();
    const [cookies, setCookies, removeCookie] = useCookies(["jwt"]);
    const [isClient, setIsClient] = useState(false);

    // Fetch user info using the provided getUserInfo function
  const getUserInfo = async () => {
    try {
      const {
        data: { user },
      } = await axios.post(
        GET_USER_INFO, // Your actual endpoint for getting user info
        {},
        {
          headers: {
            Authorization: `Bearer ${cookies.jwt}`, // Fix typo here
          },
        }
      );
      // Dispatch the user info to the global state
      dispatch({ type: reducerCases.SET_USER, userInfo: user });
    } catch (error) {
      // If the token is invalid or expired, remove the cookie and show login modal
      if (error.response?.status === 401) {
        removeCookie("jwt", { path: "/" });
        dispatch({ type: reducerCases.SET_USER, userInfo: undefined });
        dispatch({ type: reducerCases.TOGGLE_LOGIN_MODAL, showLoginModal: true });
        router.push("/");
      }
    }
  };


   useEffect(() => {
        // Enforce HTTPS on the client-side
        if (window.location.protocol === "http:") {
            window.location.href = window.location.href.replace("http:", "https:");
        }

        // Mark that the component is being rendered on the client side
        setIsClient(true);
        // Intercept responses to handle token expiration

       // Automatically set user if JWT cookie exists
    if (cookies.jwt && !userInfo) {
      getUserInfo(); // Fetch user info using the function
    }

        // Intercept responses to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 && error.response?.data?.message === "TokenExpired") {
          // JWT expired, clear cookies and user info, redirect to login
          removeCookie("jwt", { path: "/" });
          dispatch({ type: reducerCases.SET_USER, userInfo: undefined });
          dispatch({
            type: reducerCases.TOGGLE_LOGIN_MODAL,
            showLoginModal: true,
          });
          router.push("/");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [dispatch, router, cookies, removeCookie, userInfo]);

    useEffect(() => {
    // Check if we're on the client side before using localStorage
    if (isClient) {
      const savedIsSeller = localStorage.getItem("isSeller");
      if (savedIsSeller !== null) {
        dispatch({
          type: reducerCases.SWITCH_MODE,
          isSeller: JSON.parse(savedIsSeller),
        });
      }
    }
  }, [isClient, dispatch]);

  return (
    <>
      <SplashScreen key={Date.now()} />
      <div className="relative flex flex-col h-screen justify-between">
        <Navbar />
       <div
          className={`mb-auto w-full mx-auto ${router.pathname !== "/" ? "mt-32 lg:mt-36" : ""}`}
          style={{
            paddingTop: router.pathname === "/"
              ? "0"  // Remove unnecessary padding if HeroBanner is directly after Navbar
              : "0",
          }}
        >
          <Component {...pageProps} />
        </div>
        <Footer />
      </div>
      {(showLoginModal || showSignupModal) && (
        <AuthWrapper type={showLoginModal ? "login" : "signup"} />
      )}
    </>
  );
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [cookies] = useCookies();

  useEffect(() => {
    if (router.pathname.includes("/seller") || router.pathname.includes("/buyer")) {
      if (!cookies.jwt) {
        router.push("/");
      }
    }
  }, [cookies, router]);

  return (
    <StateProvider initialState={initialState} reducer={reducer}>
     <Head>
       
      </Head>
      <MainComponent Component={Component} pageProps={pageProps} />
    </StateProvider>
  );
}

