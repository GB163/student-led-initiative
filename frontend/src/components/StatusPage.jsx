import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../shared/constants/config";
import "./StatusPage.css";

const StatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/medical/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = await res.json();
        setApplication(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load your application status.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Optional: poll every 10s for updates
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [id, token]);

  // Auto-redirect with countdown for final status (Approved/Rejected)
  useEffect(() => {
    if (application && ["approved", "rejected"].includes(application.status.toLowerCase())) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            navigate("/apply");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [application, navigate]);

  if (loading) {
    return (
      <div className="status-page">
        <div>Loading your application status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-page error">
        {error}
      </div>
    );
  }

  if (!application) {
    return (
      <div className="status-page">
        <div>No application found.</div>
      </div>
    );
  }

  const isFinalStatus = ["approved", "rejected"].includes(application.status.toLowerCase());

  return (
    <div className="status-page">
      <h2>Medical Support Application Status</h2>
      
      <div className={`status-badge ${application.status.toLowerCase()}`}>
        {application.status}
      </div>

      {isFinalStatus && (
        <div className="redirect-notice">
          ⏱️ You will be redirected to apply page in {countdown} seconds...
        </div>
      )}

      <div className="status-details">
        <p>
          <strong>Patient Name:</strong>
          <span>{application.patientName}</span>
        </p>
        <p>
          <strong>Applied by:</strong>
          <span>{application.applicantName || application.staffName}</span>
        </p>
        <p>
          <strong>Relation:</strong>
          <span>{application.relation}</span>
        </p>
        <p>
          <strong>Hospital:</strong>
          <span>{application.hospital}</span>
        </p>
        <p>
          <strong>Total Cost:</strong>
          <span>₹{application.totalCost}</span>
        </p>
        <p>
          <strong>Diagnosis:</strong>
          <span>{application.diagnosis}</span>
        </p>

        {application.note && (
          <p className="note">
            <strong>Note from team:</strong>
            {application.note}
          </p>
        )}
      </div>

      <div className="files-section">
        <h4>Your Uploaded Documents</h4>
        <div>
          {application.declaration && (
            <a href={`${API_BASE_URL}${application.declaration}`} target="_blank" rel="noreferrer">
              Declaration Form
            </a>
          )}
          {application.applicantId && (
            <a href={`${API_BASE_URL}${application.applicantId}`} target="_blank" rel="noreferrer">
              Applicant ID
            </a>
          )}
          {application.staffId && (
            <a href={`${API_BASE_URL}${application.staffId}`} target="_blank" rel="noreferrer">
              Staff ID
            </a>
          )}
          {application.incomeProof && (
            <a href={`${API_BASE_URL}${application.incomeProof}`} target="_blank" rel="noreferrer">
              Income Proof
            </a>
          )}
          {application.photo && (
            <a href={`${API_BASE_URL}${application.photo}`} target="_blank" rel="noreferrer">
              Patient Photo
            </a>
          )}
          {application.hospitalBill && (
            <a href={`${API_BASE_URL}${application.hospitalBill}`} target="_blank" rel="noreferrer">
              Hospital Bill
            </a>
          )}
          {application.reports && application.reports.map((r, i) => (
            <a key={i} href={`${API_BASE_URL}${r}`} target="_blank" rel="noreferrer">
              Medical Report {i + 1}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusPage;