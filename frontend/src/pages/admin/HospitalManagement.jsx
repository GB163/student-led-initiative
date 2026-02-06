import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, MapPin, Phone, Mail, Building2, Save, Search } from 'lucide-react';
import { hospitalAPI } from "../../shared/services/api";

const AdminHospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsType, setStatsType] = useState('');
  const [editingHospital, setEditingHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    address: '',
    specialties: ''
  });

  // Fetch hospitals on component mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const result = await hospitalAPI.getAll(); // Use the API service
      
      if (result.success) {
        setHospitals(result.data);
      } else {
        alert('Failed to fetch hospitals');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      alert(error.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location || !formData.phone || !formData.email || !formData.address || !formData.specialties) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    
    const hospitalData = {
      name: formData.name,
      location: formData.location,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
      if (editingHospital) {
        // Update existing hospital
        const result = await hospitalAPI.update(editingHospital._id, hospitalData);

        if (result.success) {
          alert('Hospital updated successfully!');
          fetchHospitals(); // Refresh the list
          resetForm();
        } else {
          alert(result.message || 'Failed to update hospital');
        }
      } else {
        // Create new hospital
        const result = await hospitalAPI.create(hospitalData);

        if (result.success) {
          alert('Hospital added successfully!');
          fetchHospitals(); // Refresh the list
          resetForm();
        } else {
          alert(result.message || 'Failed to add hospital');
        }
      }
    } catch (error) {
      console.error('Error saving hospital:', error);
      alert(error.message || 'Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      location: hospital.location,
      phone: hospital.phone,
      email: hospital.email,
      address: hospital.address,
      specialties: hospital.specialties.join(', ')
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hospital?')) {
      return;
    }

    try {
      const result = await hospitalAPI.delete(id);

      if (result.success) {
        alert('Hospital deleted successfully!');
        fetchHospitals(); // Refresh the list
      } else {
        alert(result.message || 'Failed to delete hospital');
      }
    } catch (error) {
      console.error('Error deleting hospital:', error);
      alert(error.message || 'Error connecting to server');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      phone: '',
      email: '',
      address: '',
      specialties: ''
    });
    setEditingHospital(null);
    setShowModal(false);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleStatCardClick = (type) => {
    setStatsType(type);
    setShowStatsModal(true);
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatsDetails = () => {
    if (statsType === 'total') {
      return {
        title: 'All Hospitals',
        data: hospitals
      };
    } else if (statsType === 'cities') {
      const citiesMap = {};
      hospitals.forEach(h => {
        if (!citiesMap[h.location]) {
          citiesMap[h.location] = [];
        }
        citiesMap[h.location].push(h);
      });
      return {
        title: 'Hospitals by City',
        data: citiesMap
      };
    } else if (statsType === 'partners') {
      return {
        title: 'Active Partners',
        data: hospitals
      };
    }
    return { title: '', data: [] };
  };

  const renderStatsModalContent = () => {
    const details = getStatsDetails();
    
    if (statsType === 'cities') {
      return (
        <div style={styles.statsModalContent}>
          {Object.entries(details.data).map(([city, cityHospitals]) => (
            <div key={city} style={styles.cityGroup}>
              <div style={styles.cityHeader}>
                <MapPin size={20} color="#10b981" />
                <h3 style={styles.cityName}>{city}</h3>
                <span style={styles.cityCount}>{cityHospitals.length} {cityHospitals.length === 1 ? 'hospital' : 'hospitals'}</span>
              </div>
              <div style={styles.cityHospitals}>
                {cityHospitals.map(hospital => (
                  <div key={hospital._id} style={styles.hospitalCard}>
                    <div style={styles.hospitalCardHeader}>
                      <Building2 size={18} color="#3b82f6" />
                      <span style={styles.hospitalCardName}>{hospital.name}</span>
                    </div>
                    <div style={styles.hospitalCardDetails}>
                      <div style={styles.hospitalCardDetail}>
                        <Phone size={14} color="#6b7280" />
                        <span>{hospital.phone}</span>
                      </div>
                      <div style={styles.hospitalCardDetail}>
                        <Mail size={14} color="#6b7280" />
                        <span>{hospital.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={styles.statsModalContent}>
        {details.data.map(hospital => (
          <div key={hospital._id} style={styles.detailCard}>
            <div style={styles.detailCardHeader}>
              <div style={styles.detailCardIcon}>
                <Building2 size={20} color="#3b82f6" />
              </div>
              <div style={styles.detailCardInfo}>
                <h3 style={styles.detailCardTitle}>{hospital.name}</h3>
                <div style={styles.detailCardLocation}>
                  <MapPin size={14} color="#10b981" />
                  <span>{hospital.location}</span>
                </div>
              </div>
            </div>
            <div style={styles.detailCardBody}>
              <p style={styles.detailCardAddress}>{hospital.address}</p>
              <div style={styles.detailCardContacts}>
                <div style={styles.detailCardContact}>
                  <Phone size={16} color="#3b82f6" />
                  <span>{hospital.phone}</span>
                </div>
                <div style={styles.detailCardContact}>
                  <Mail size={16} color="#9333ea" />
                  <span>{hospital.email}</span>
                </div>
              </div>
              <div style={styles.detailCardSpecialties}>
                {hospital.specialties.map((specialty, idx) => (
                  <span key={idx} style={styles.detailSpecialtyTag}>
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <Building2 color="white" size={32} />
            </div>
            <div>
              <h1 style={styles.title}>Hospital Management</h1>
              <p style={styles.subtitle}>Manage partner hospitals and their information</p>
            </div>
          </div>
          <button onClick={handleAddNew} style={styles.addButton}>
            <Plus size={20} strokeWidth={2.5} />
            <span>Add Hospital</span>
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, cursor: 'pointer'}} onClick={() => handleStatCardClick('total')}>
            <div style={styles.statCardContent}>
              <div>
                <p style={styles.statLabel}>Total Hospitals</p>
                <p style={styles.statValue}>{loading ? '...' : hospitals.length}</p>
                <p style={styles.statBadge}>● Active</p>
              </div>
              <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}>
                <Building2 color="white" size={28} />
              </div>
            </div>
          </div>
          
          <div style={{...styles.statCard, cursor: 'pointer'}} onClick={() => handleStatCardClick('cities')}>
            <div style={styles.statCardContent}>
              <div>
                <p style={styles.statLabel}>Cities Covered</p>
                <p style={styles.statValue}>{loading ? '...' : new Set(hospitals.map(h => h.location)).size}</p>
                <p style={{...styles.statBadge, color: '#2563eb'}}>Locations</p>
              </div>
              <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                <MapPin color="white" size={28} />
              </div>
            </div>
          </div>
          
          <div style={{...styles.statCard, cursor: 'pointer'}} onClick={() => handleStatCardClick('partners')}>
            <div style={styles.statCardContent}>
              <div>
                <p style={styles.statLabel}>Active Partners</p>
                <p style={styles.statValue}>{loading ? '...' : hospitals.length}</p>
                <p style={{...styles.statBadge, color: '#9333ea'}}>Partners</p>
              </div>
              <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'}}>
                <Phone color="white" size={28} />
              </div>
            </div>
          </div>
        </div>

        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Search style={styles.searchIcon} size={22} />
            <input
              type="text"
              placeholder="Search hospitals by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading hospitals...</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Building2 color="#3b82f6" size={48} />
              </div>
              <h3 style={styles.emptyTitle}>No hospitals added yet</h3>
              <p style={styles.emptyText}>
                Get started by adding your first partner hospital to the system
              </p>
              <button onClick={handleAddNew} style={styles.emptyButton}>
                <Plus size={20} strokeWidth={2.5} />
                <span>Add Your First Hospital</span>
              </button>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Hospital</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>Specialties</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHospitals.map((hospital) => (
                    <tr key={hospital._id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={styles.hospitalCell}>
                          <div style={styles.hospitalIcon}>
                            <Building2 color="#3b82f6" size={22} />
                          </div>
                          <div style={styles.hospitalInfo}>
                            <p style={styles.hospitalName}>{hospital.name}</p>
                            <p style={styles.hospitalAddress}>{hospital.address}</p>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.locationCell}>
                          <MapPin size={18} color="#10b981" />
                          <span>{hospital.location}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.contactCell}>
                          <div style={styles.contactItem}>
                            <Phone size={16} color="#3b82f6" />
                            <span>{hospital.phone}</span>
                          </div>
                          <div style={styles.contactItem}>
                            <Mail size={16} color="#9333ea" />
                            <span>{hospital.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.specialtiesCell}>
                          {hospital.specialties.slice(0, 2).map((specialty, idx) => (
                            <span key={idx} style={styles.specialtyTag}>
                              {specialty}
                            </span>
                          ))}
                          {hospital.specialties.length > 2 && (
                            <span style={styles.moreTag}>
                              +{hospital.specialties.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <button onClick={() => handleEdit(hospital)} style={styles.editButton} title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(hospital._id)} style={styles.deleteButton} title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
              </h2>
              <button onClick={resetForm} style={styles.closeButton} disabled={submitting}>
                <X size={26} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Hospital Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter hospital name"
                  disabled={submitting}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Location <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="City, State"
                  disabled={submitting}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Address <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  style={{...styles.input, resize: 'none'}}
                  placeholder="Full address"
                  disabled={submitting}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Phone Number <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="+91 XXXXX XXXXX"
                    disabled={submitting}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Email Address <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="email@example.com"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Specialties <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Pediatric Cardiology, Neonatology, etc."
                  disabled={submitting}
                />
                <p style={styles.helpText}>
                  Enter specialties separated by commas
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleSubmit} style={styles.submitButton} disabled={submitting}>
                <Save size={20} strokeWidth={2.5} />
                <span>{submitting ? 'Saving...' : (editingHospital ? 'Update Hospital' : 'Add Hospital')}</span>
              </button>
              <button onClick={resetForm} style={styles.cancelButton} disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStatsModal(false)}>
          <div style={styles.statsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.statsModalHeader}>
              <h2 style={styles.modalTitle}>{getStatsDetails().title}</h2>
              <button onClick={() => setShowStatsModal(false)} style={styles.closeButton}>
                <X size={26} />
              </button>
            </div>
            <div style={styles.statsModalBody}>
              {hospitals.length === 0 ? (
                <div style={styles.emptyStatsState}>
                  <Building2 color="#9ca3af" size={48} />
                  <p style={styles.emptyStatsText}>No hospitals to display</p>
                </div>
              ) : (
                renderStatsModalContent()
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 25%, #eef2ff 50%, #f5f3ff 75%, #faf5ff 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
    backdropFilter: 'blur(10px)'
  },
  headerContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px'
  },
  iconBox: {
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    padding: '16px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 6px 0',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    color: '#6b7280',
    margin: 0,
    fontSize: '16px'
  },
  addButton: {
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    color: 'white',
    padding: '14px 24px',
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s'
  },
  mainContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '40px 24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  statCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s'
  },
  statCardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px 0'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  statBadge: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '500',
    margin: 0
  },
  statIcon: {
    padding: '16px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  searchContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    marginBottom: '32px'
  },
  searchWrapper: {
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '16px 16px 16px 56px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    overflow: 'hidden'
  },
  loadingState: {
    textAlign: 'center',
    padding: '96px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '96px 24px'
  },
  emptyIcon: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
    width: '96px',
    height: '96px',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 12px 0'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '18px',
    margin: '0 auto 32px',
    maxWidth: '448px'
  },
  emptyButton: {
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    color: 'white',
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    borderBottom: '2px solid #e5e7eb'
  },
  th: {
    padding: '20px 32px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'all 0.2s',
    cursor: 'default'
  },
  td: {
    padding: '24px 32px',
    verticalAlign: 'middle'
  },
  hospitalCell: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px'
  },
  hospitalIcon: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    padding: '12px',
    borderRadius: '12px',
    flexShrink: 0
  },
  hospitalInfo: {
    minWidth: 0
  },
  hospitalName: {
    fontWeight: 'bold',
    color: '#111827',
    fontSize: '16px',
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  hospitalAddress: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  locationCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#374151'
  },
  specialtiesCell: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  specialtyTag: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    color: '#1e40af',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #bfdbfe'
  },
  moreTag: {
    background: '#f3f4f6',
    color: '#374151',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #e5e7eb'
  },
  actionsCell: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px'
  },
  editButton: {
    background: '#3b82f6',
    color: 'white',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
  },
  deleteButton: {
    background: '#ef4444',
    color: 'white',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 50
  },
  modal: {
    background: 'white',
    borderRadius: '24px',
    maxWidth: '768px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  },
  closeButton: {
    color: 'white',
    background: 'transparent',
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modalBody: {
    padding: '32px',
    overflowY: 'auto',
    flex: 1
  },
  formGroup: {
    marginBottom: '24px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px'
  },
  required: {
    color: '#ef4444'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  helpText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0 0 0',
    fontWeight: '500'
  },
  modalFooter: {
    background: '#f9fafb',
    padding: '24px 32px',
    display: 'flex',
    gap: '16px',
    borderTop: '2px solid #f3f4f6'
  },
  submitButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s'
  },
  cancelButton: {
    padding: '16px 32px',
    border: '2px solid #d1d5db',
    color: '#374151',
    borderRadius: '12px',
    background: 'white',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  statsModal: {
    background: 'white',
    borderRadius: '24px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  statsModalHeader: {
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statsModalBody: {
    padding: '32px',
    overflowY: 'auto',
    flex: 1
  },
  statsModalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  cityGroup: {
    background: '#f9fafb',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb'
  },
  cityHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb'
  },
  cityName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
    flex: 1
  },
  cityCount: {
    background: 'white',
    color: '#10b981',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 'bold',
    border: '1px solid #d1fae5'
  },
  cityHospitals: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  hospitalCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s'
  },
  hospitalCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  hospitalCardName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111827'
  },
  hospitalCardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '30px'
  },
  hospitalCardDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#6b7280'
  },
  detailCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s'
  },
  detailCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb'
  },
  detailCardIcon: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    padding: '14px',
    borderRadius: '12px',
    flexShrink: 0
  },
  detailCardInfo: {
    flex: 1,
    minWidth: 0
  },
  detailCardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  detailCardLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#10b981'
  },
  detailCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  detailCardAddress: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6'
  },
  detailCardContacts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  detailCardContact: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500'
  },
  detailCardSpecialties: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  detailSpecialtyTag: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    color: '#1e40af',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #bfdbfe'
  },
  emptyStatsState: {
    textAlign: 'center',
    padding: '64px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  emptyStatsText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  }
};

export default AdminHospitalManagement;