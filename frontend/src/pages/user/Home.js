import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Add this import
import HeroSection from "../../components/HeroSection";
import DonateModal from "../../components/DonateModal";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate(); // ✅ Add this
  const [isDonateModalOpen, setDonateModalOpen] = useState(false);

  const openDonateModal = () => setDonateModalOpen(true);
  const closeDonateModal = () => setDonateModalOpen(false);
  
  // ✅ Add this function
  const handleJoinUs = () => {
    navigate('/joinus');
  };

  return (
    <div
      className="home-container"
      style={{ backgroundImage: "url(/home-background.jpg)" }}
    >
      <div className="home-overlay">
        <HeroSection 
          openDonateModal={openDonateModal}
          onJoinUsClick={handleJoinUs} // ✅ Add this prop
        />
        {isDonateModalOpen && <DonateModal closeModal={closeDonateModal} />}
      </div>
    </div>
  );
};

export default Home;