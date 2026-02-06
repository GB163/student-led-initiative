// frontend/src/components/DonateModal.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./DonateModal.css";
import { colleges as collegesList } from "../data/colleges";
import { API_BASE_URL } from "../shared/constants/config"; 

const DonateModal = ({ closeModal }) => {
  const [step, setStep] = useState("select");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [colleges, setColleges] = useState([]);

  // Student: Fixed ₹600 yearly
  const studentAmount = 600;
  
  // Professional: Quick amounts starting from ₹500
  const professionalQuickAmounts = [500, 1000, 2500, 5000];

  useEffect(() => {
    // Use local college data
    const sortedColleges = [...collegesList].sort((a, b) =>
      a.localeCompare(b)
    );
    setColleges(["Select your college", ...sortedColleges, "Other (Not Listed)"]);
  }, []);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    closeModal();
  };

  const handleBack = (e) => {
    if (e) e.stopPropagation();
    setStep("select");
    setName("");
    setEmail("");
    setPhone("");
    setCollegeName("");
    setRollNumber("");
    setAmount("");
    setSelectedAmount("");
  };

  const handleQuickAmount = (amt) => {
    setSelectedAmount(amt);
    setAmount(amt.toString());
  };

  const handleCustomAmount = (value) => {
    setAmount(value);
    setSelectedAmount("");
  };

  // When student option is selected, set amount to 600
  const handleStudentSelect = () => {
    setStep("student");
    setAmount(studentAmount.toString());
    setSelectedAmount(studentAmount);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || name.trim() === "") {
      alert("Please enter your name");
      return;
    }

    if (!email || email.trim() === "" || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    if (step === "student") {
      if (!collegeName || collegeName === "Select your college") {
        alert("Please select your college");
        return;
      }
      if (!rollNumber || rollNumber.trim() === "") {
        alert("Please enter your roll number");
        return;
      }
      // Validate student amount is exactly 600
      if (parseFloat(amount) !== studentAmount) {
        alert(`Student donation must be ₹${studentAmount} (Yearly)`);
        return;
      }
    }

    if (step === "professional") {
      // Validate professional minimum amount is 500
      if (!amount || parseFloat(amount) < 500) {
        alert("Professional donation must be at least ₹500");
        return;
      }
    }

    setLoading(true);

    try {
      const donationData = {
        name,
        email,
        phone: phone || "9999999999",
        amount,
        role: step === "student" ? "student" : "professional",
        donationType: step === "student" ? "yearly" : "one-time",
      };

      if (step === "student") {
        donationData.collegeName = collegeName;
        donationData.rollNumber = rollNumber;
      }

      // Create PayU order
      const orderRes = await axios.post(
        `${API_BASE_URL}/api/donations/create-order`,
        donationData
      );

      const payuData = orderRes.data;

      if (!payuData.success) {
        alert(payuData.message || "Failed to create payment order");
        setLoading(false);
        return;
      }

      // Create a form and submit to PayU
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payuData.payuUrl;

      // Add all PayU parameters as hidden fields
      const payuParams = {
        key: payuData.key,
        txnid: payuData.txnid,
        amount: payuData.amount,
        productinfo: payuData.productinfo,
        firstname: payuData.firstname,
        email: payuData.email,
        phone: payuData.phone,
        surl: payuData.surl,
        furl: payuData.furl,
        hash: payuData.hash,
        udf1: payuData.udf1,
        udf2: payuData.udf2,
        udf3: payuData.udf3,
        udf4: payuData.udf4,
        udf5: payuData.udf5 || "",
      };

      Object.keys(payuParams).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = payuParams[key];
        form.appendChild(input);
      });

      // Append form to body and submit
      document.body.appendChild(form);
      console.log("✅ Redirecting to PayU payment gateway...");
      form.submit();

    } catch (err) {
      console.error("PayU order creation failed:", err);
      alert(err.response?.data?.message || "Failed to initialize payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-top-right" onClick={handleClose} type="button">
          ×
        </button>

        {step === "select" && (
          <div className="selection-screen">
            <div className="modal-header">
              <div className="modal-icon">💜</div>
              <h2 className="modal-title">Make a Donation</h2>
              <p className="modal-subtitle">Choose your category to continue</p>
            </div>

            <div className="selection-cards">
              <div className="selection-card" onClick={handleStudentSelect}>
                <div className="card-icon">🎓</div>
                <h3 className="card-title">I&apos;m a Student</h3>
                <p className="card-description">
                  ₹600 yearly contribution
                </p>
                <button className="card-button" type="button">
                  Select
                </button>
              </div>

              <div className="selection-card" onClick={() => setStep("professional")}>
                <div className="card-icon">💼</div>
                <h3 className="card-title">I&apos;m a Working Professional</h3>
                <p className="card-description">
                  Starting from ₹500 (One-time)
                </p>
                <button className="card-button" type="button">
                  Select
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "student" && (
          <div className="form-screen">
            <div className="modal-header">
              <button className="back-button" onClick={handleBack} type="button">
                ← Back
              </button>
              <div className="modal-icon">🎓</div>
              <h2 className="modal-title">Student Yearly Donation</h2>
              <p className="modal-subtitle">
                ₹600 yearly contribution - Making a lasting impact together
              </p>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Donation Amount (Fixed for Students)</label>
                <div className="student-amount-box">
                  ₹600 <span className="per-year-text">per year</span>
                </div>
                <p className="amount-help-text">
                  This yearly contribution helps us plan sustainable support for children in need
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">College Name</label>
                <select
                  className="form-select"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                >
                  {colleges.map((college, index) => (
                    <option key={index} value={college} disabled={index === 0}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Roll Number / Student ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Enter your roll number"
                />
              </div>

              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                {loading ? "Redirecting to Payment..." : "Donate ₹600"}
              </button>

              <p className="security-note">
                <span>🔒</span>
                <span>Secure payment powered by PayU</span>
              </p>
            </div>
          </div>
        )}

        {step === "professional" && (
          <div className="form-screen">
            <div className="modal-header">
              <button className="back-button" onClick={handleBack} type="button">
                ← Back
              </button>
              <div className="modal-icon">💼</div>
              <h2 className="modal-title">Make a Donation</h2>
              <p className="modal-subtitle">
                One-time contribution starting from ₹500
              </p>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Amount (Minimum ₹500)</label>
                <div className="amount-grid">
                  {professionalQuickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`amount-button ${selectedAmount === amt ? "active" : ""}`}
                      onClick={() => handleQuickAmount(amt)}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Or Enter Custom Amount</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    className="form-input with-symbol"
                    value={amount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="500"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                {loading ? "Redirecting to Payment..." : "Complete Donation"}
              </button>

              <p className="security-note">
                <span>🔒</span>
                <span>Secure payment powered by PayU</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

DonateModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
};

export default DonateModal;