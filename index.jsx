import { useStateProvider } from "../context/StateContext";
import AuthWrapper from "../components/AuthWrapper";
import HeroBanner from "@/components/landing/HeroBanner";
//import JoinWorkmanship from "@/components/landing/JoinWorkmanship";
import PopularServices from "@/components/landing/PopularServices";
import Services from "@/components/landing/Services";
import CardServices from "@/components/CardServices";
import DashboardSummary from "@/components/DashboardSummary";
import WorkActionsCard from "@/components/WorkActionsCard";
//import SearchCard from "@/components/SearchCard";
import React, { useRef, useState, useEffect } from 'react';
import PopularLinks from "@/components/PopularLinks";
import GigsCarousel from "@/components/GigsCarousel"; // Import the new carousel component
import GigsEmployer from "@/components/GigsEmployer";
import HowItWorks from "@/components/HowItWorks";
import CardServicess from "@/components/CardServicess";
import TalentCard from "@/components/TalentCard";
import EnterpriseSuiteCard from "@/components/EnterpriseSuiteCard";
import MobileBottomNav from "@/components/MobileBottomNavbar";
import RecentlyPostedGigs from "@/components/RecentlyPostedGigs";
import GigTitles from "@/components/GigTitles";
import Companies from "@/components/landing/Companies";
import SplashScreen from "@/components/SplashScreen";
import FeatureCardsContainer from "@/components/FeatureCardsContainer";
import SliderMenu from "@/components/SliderMenu";
import Footer from "@/components/Footer";
//import SearchBar from "@/components/SearchBar";
//import Chatbot from "@/components/Chatbot";


function Index() {
  const [{ showLoginModal, showSignupModal, userInfo, isSeller }] = useStateProvider();
  const servicesRef = useRef(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    // Set a small delay to check for userInfo
    const timer = setTimeout(() => {
      setLoading(false); // Finish loading after timeout
    }, 500); // Adjust delay time as needed

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [userInfo]);

  // Show SplashScreen only if loading and user is logged in
  if (loading && userInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SplashScreen />
      </div>
    );
  }
  
  return (
    <>
      {userInfo && (
      <div className="hidden lg:block">
        <SliderMenu />
      </div>
    )}
    
    <div className={`${userInfo ? 'lg:ml-[192px] lg:pl-2' : ''}`}>

     {/* Render HeroBanner only when userInfo is not present */}
      {!userInfo && (
        <div className="w-full"> {/* Remove any margin to make HeroBanner start right after Navbar */}
          <HeroBanner />
          <Companies />

        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {!userInfo && (
          <>
            <PopularLinks servicesRef={servicesRef} />
            <RecentlyPostedGigs />
            <PopularServices />
            <GigsCarousel />
          </>
        )}

        {!userInfo && (
          <div className="w-full mt-2"> {/* Remove any margin to make HeroBanner start right after Navbar */}
            <GigTitles />
          </div>
        )}

        {!userInfo && (
          <>
            <Services />
           <FeatureCardsContainer />
          </>
        )}
      </div>

      <div className="w-full bg-gray-100">
        {!userInfo && <HowItWorks />}
      </div>


      {userInfo && (
        <div className="w-full -mt-0"> {/* Full width container for DashboardSummary */}
          <DashboardSummary />
        </div>
      )}

      {userInfo && (
        <>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {!isSeller && <GigsEmployer />}
            {!isSeller && <RecentlyPostedGigs />}
            {isSeller && <WorkActionsCard />}
          </div>
        </>
      )}
      
      {/* Conditionally render CardServices and CardServicess */}
     {(!userInfo || isSeller) && (
  <div ref={servicesRef} className="mt-0">
    {/* Render CardServices on medium and larger screens */}
    <div className="hidden md:block">
      <CardServices />
    </div>

    {/* Render CardServicess on small screens */}
    <div className="block md:hidden">
      <CardServicess />
    </div>
  </div>
)}

   {userInfo && <MobileBottomNav />}
  {!userInfo && <Footer />}

      {/* Add the Chatbot component to the page 
      <Chatbot />
      */}

      {(showLoginModal || showSignupModal) && (
        <AuthWrapper type={showLoginModal ? "login" : "signup"} />
      )}
        </div>
    </>
  );
}

export default Index;
