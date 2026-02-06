import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from 'shared/services/api';
import { API_BASE_URL } from "../shared/constants/config";
import "./ApplyMedicalSupport.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const ApplyMedicalSupport = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Refs for hidden file inputs
  const declarationRef = useRef(null);
  const applicantIdRef = useRef(null);
  const incomeProofRef = useRef(null);
  const photoRef = useRef(null);
  const hospitalBillRef = useRef(null);
  const reportsRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({
    name: "",
    role: "user",
  });

  const [formData, setFormData] = useState({
    applicantName: "",
    email: "",
    patientName: "",
    age: "",
    relation: "",
    bloodGroup: "",
    phone: "",
    adharCard: "",
    diagnosis: "",
    hospital: "",
    doctorName: "",
    totalCost: "",
  });

  const [declaration, setDeclaration] = useState(null);
  const [applicantId, setApplicantId] = useState(null);
  const [incomeProof, setIncomeProof] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [hospitalBill, setHospitalBill] = useState(null);
  const [reports, setReports] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const applicantLabel = useMemo(
    () => (currentUser.role === "staff" ? "Staff Name" : "Applicant Name"),
    [currentUser.role]
  );

  useEffect(() => {
    let cancelled = false;
    
    async function checkExistingApplication() {
      try {
        // ✅ FIX: Use apiClient instead of fetch
        const response = await apiClient.get('/medical/my-application');
        console.log('Existing application check:', response.data); // ✅ DEBUG LOG
        
        if (response.data.application && !cancelled) {
          navigate(`/status/${response.data.application._id}`);
        }
      } catch (err) {
        if (err.message !== 'Failed to fetch') {
          console.error("Error checking application:", err);
        }
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    }

    checkExistingApplication();
    
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      let profile = null;
      try {
        // ✅ FIX: Use apiClient instead of fetch
        const response = await apiClient.get('/auth/me');
        console.log('User profile:', response.data); // ✅ DEBUG LOG
        profile = response.data;
      } catch (err) {
        console.log("Could not fetch user profile, using token data");
      }
      if (!profile && token) {
        const decoded = parseJwt(token);
        if (decoded) {
          profile = {
            name: decoded.name || decoded.username || "",
            role: decoded.role || "user",
          };
        }
      }
      if (!cancelled) {
        const finalUser = profile || { name: "", role: "user" };
        setCurrentUser(finalUser);
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const validatePdf = (file) => {
    if (!file) return "File not selected";
    if (file.type !== "application/pdf") return "Only PDF files are allowed";
    if (file.size > MAX_FILE_SIZE) return "File size exceeds 10MB";
    return null;
  };

  const onPickDeclaration = (f) => {
    const err = validatePdf(f);
    setErrors((e) => ({ ...e, declaration: err }));
    if (!err) setDeclaration(f);
    else setDeclaration(null);
  };

  const onPickApplicantId = (f) => {
    const err = validatePdf(f);
    setErrors((e) => ({ ...e, applicantId: err }));
    if (!err) setApplicantId(f);
    else setApplicantId(null);
  };

  const onPickIncomeProof = (f) => {
    const err = validatePdf(f);
    setErrors((e) => ({ ...e, incomeProof: err }));
    if (!err) setIncomeProof(f);
    else setIncomeProof(null);
  };

  const onPickHospitalBill = (f) => {
    const err = validatePdf(f);
    setErrors((e) => ({ ...e, hospitalBill: err }));
    if (!err) setHospitalBill(f);
    else setHospitalBill(null);
  };

  const onPickReports = (fileList) => {
    const arr = Array.from(fileList || []);
    const good = [];
    const bad = [];
    arr.forEach((f) => {
      const err = validatePdf(f);
      if (!err) good.push(f);
      else bad.push(`${f.name}: ${err}`);
    });
    setReports((prev) => [...prev, ...good]);
    setErrors((e) => ({ ...e, reports: bad.length ? bad.join(", ") : null }));
  };

  const removeReportAt = (idx) =>
    setReports((prev) => prev.filter((_, i) => i !== idx));

  const validateForm = () => {
    const e = {};
    const requiredFields = [
      "applicantName",
      "email",
      "patientName",
      "age",
      "relation",
      "bloodGroup",
      "phone",
      "adharCard",
      "diagnosis",
      "hospital",
      "doctorName",
      "totalCost",
    ];
    requiredFields.forEach((f) => {
      if (!String(formData[f] || "").trim()) e[f] = "Required";
    });

    if (!declaration) e.declaration = "Required";
    if (!applicantId) e.applicantId = "Required";
    if (!incomeProof) e.incomeProof = "Required";
    if (!photo) e.photo = "Required";
    if (!hospitalBill) e.hospitalBill = "Required";
    if (!confirmChecked) e.confirm = "You must confirm before submitting";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (key !== "applicantName") data.append(key, val);
      });

      if (currentUser.role === "staff") {
        data.append("staffName", formData.applicantName);
      } else {
        data.append("applicantName", formData.applicantName);
      }

      data.append("role", currentUser.role || "user");

      if (declaration) data.append("declaration", declaration);
      if (applicantId)
        data.append(
          currentUser.role === "staff" ? "staffId" : "applicantId",
          applicantId
        );
      if (incomeProof) data.append("incomeProof", incomeProof);
      if (photo) data.append("photo", photo);
      if (hospitalBill) data.append("hospitalBill", hospitalBill);
      reports.forEach((r) => data.append("reports", r));

      // ✅ FIX: Use apiClient instead of fetch
      // Note: apiClient automatically handles multipart/form-data when you pass FormData
      const response = await apiClient.post('/medical/apply', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Application submitted:', response.data); // ✅ DEBUG LOG
      navigate(`/status/${response.data.id}`);
      
    } catch (err) {
      console.error('Application submission error:', err);
      alert(err.message || "Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="apply-medical-card">
        <p>Checking application status...</p>
      </div>
    );
  }

  return (
    <div className="apply-medical-card">
      <h2>Apply for Medical Support</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Applicant Information Section */}
        <div className="form-section">
          <h3 className="form-section-title">Applicant Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{applicantLabel}</label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.applicantName && (
                <div className="error">{errors.applicantName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
              />
              {errors.phone && <div className="error">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label>Aadhar Card Number</label>
              <input
                type="text"
                name="adharCard"
                value={formData.adharCard}
                onChange={handleChange}
                placeholder="XXXX XXXX XXXX"
              />
              {errors.adharCard && (
                <div className="error">{errors.adharCard}</div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details Section */}
        <div className="form-section">
          <h3 className="form-section-title">Patient Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Patient Name</label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="Patient's full name"
              />
              {errors.patientName && (
                <div className="error">{errors.patientName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Patient's age"
              />
              {errors.age && <div className="error">{errors.age}</div>}
            </div>

            <div className="form-group">
              <label>Relation to Patient</label>
              <input
                type="text"
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                placeholder="e.g., Father, Mother, Guardian"
              />
              {errors.relation && <div className="error">{errors.relation}</div>}
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && (
                <div className="error">{errors.bloodGroup}</div>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="form-section">
          <h3 className="form-section-title">Medical Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Diagnosis</label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                placeholder="Medical diagnosis"
              />
              {errors.diagnosis && (
                <div className="error">{errors.diagnosis}</div>
              )}
            </div>

            <div className="form-group">
              <label>Hospital Name</label>
              <input
                type="text"
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                placeholder="Name of treating hospital"
              />
              {errors.hospital && <div className="error">{errors.hospital}</div>}
            </div>

            <div className="form-group">
              <label>Doctor Name</label>
              <input
                type="text"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleChange}
                placeholder="Treating doctor's name"
              />
              {errors.doctorName && (
                <div className="error">{errors.doctorName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Total Treatment Cost (₹)</label>
              <input
                type="number"
                name="totalCost"
                value={formData.totalCost}
                onChange={handleChange}
                placeholder="Estimated total cost"
              />
              {errors.totalCost && (
                <div className="error">{errors.totalCost}</div>
              )}
            </div>
          </div>
        </div>

        {/* Required Documents Section */}
        <div className="form-section">
          <h3 className="form-section-title">Required Documents</h3>
          
          <div className="form-grid">
            {/* Declaration Form */}
            <div className="form-group full">
              <div className="document-upload-area">
                <label>
                  Declaration Form{" "}
                  <a href="/declaration_form.pdf" download>
                    DOWNLOAD
                  </a>
                </label>
                <input
                  ref={declarationRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onPickDeclaration(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="custom-file-button"
                  onClick={() => declarationRef.current?.click()}
                >
                  Choose File
                </button>
                {declaration && (
                  <span className="file-name">✓ {declaration.name}</span>
                )}
                {errors.declaration && (
                  <div className="error">{errors.declaration}</div>
                )}
              </div>
            </div>

            {/* Applicant ID */}
            <div className="form-group full">
              <div className="document-upload-area">
                <label>
                  {currentUser.role === "staff" ? "Staff ID" : "Applicant ID"} (PDF only)
                </label>
                <input
                  ref={applicantIdRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onPickApplicantId(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="custom-file-button"
                  onClick={() => applicantIdRef.current?.click()}
                >
                  Choose File
                </button>
                {applicantId && (
                  <span className="file-name">✓ {applicantId.name}</span>
                )}
                {errors.applicantId && (
                  <div className="error">{errors.applicantId}</div>
                )}
              </div>
            </div>

            {/* Income Proof */}
            <div className="form-group full">
              <div className="document-upload-area">
                <label>Income Proof (PDF only)</label>
                <input
                  ref={incomeProofRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onPickIncomeProof(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="custom-file-button"
                  onClick={() => incomeProofRef.current?.click()}
                >
                  Choose File
                </button>
                {incomeProof && (
                  <span className="file-name">✓ {incomeProof.name}</span>
                )}
                {errors.incomeProof && (
                  <div className="error">{errors.incomeProof}</div>
                )}
              </div>
            </div>

            {/* Patient Photo */}
            <div className="form-group full">
              <div className="document-upload-area">
                <label>Patient Photo (Image file)</label>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="custom-file-button"
                  onClick={() => photoRef.current?.click()}
                >
                  Choose File
                </button>
                {photo && (
                  <span className="file-name">✓ {photo.name}</span>
                )}
                {errors.photo && <div className="error">{errors.photo}</div>}
              </div>
            </div>

            {/* Hospital Bill */}
            <div className="form-group full">
              <div className="document-upload-area">
                <label>Hospital Bill (PDF only)</label>
                <input
                  ref={hospitalBillRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onPickHospitalBill(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="custom-file-button"
                  onClick={() => hospitalBillRef.current?.click()}
                >
                  Choose File
                </button>
                {hospitalBill && (
                  <span className="file-name">✓ {hospitalBill.name}</span>
                )}
                {errors.hospitalBill && (
                  <div className="error">{errors.hospitalBill}</div>
                )}
              </div>
            </div>

            {/* Medical Reports */}
            <div className="form-group full">
              <div className="document-upload-area">
                <label>Medical Reports (Multiple PDFs allowed)</label>
                <input
                  ref={reportsRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => onPickReports(e.target.files)}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="custom-file-button"
                  onClick={() => reportsRef.current?.click()}
                >
                  Choose Files
                </button>
                {errors.reports && <div className="error">{errors.reports}</div>}
                {reports.length > 0 && (
                  <ul>
                    {reports.map((r, idx) => (
                      <li key={idx}>
                        {r.name}{" "}
                        <button type="button" onClick={() => removeReportAt(idx)}>
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Section */}
        <div className="form-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              id="confirm-checkbox"
            />
            <label htmlFor="confirm-checkbox">
              I confirm that all details and documents provided are genuine and accurate.
            </label>
          </div>
          {errors.confirm && <div className="error">{errors.confirm}</div>}
        </div>

        {/* Submit Button */}
        <div className="submit-section">
          <button type="submit" disabled={loading}>
            {loading ? "Submitting Application..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyMedicalSupport;