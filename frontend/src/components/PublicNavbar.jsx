import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Info, Calendar, BookOpen, LogIn, Menu, X } from "lucide-react";

function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav style={styles.navbar}>
        {/* Logo Section - Left Side */}
        <div style={styles.navbarLeft}>
          <Link to="/signin" style={styles.logo} onClick={closeMenu}>
            🎗️ Student-Led-Initiative
          </Link>
        </div>

        {/* Right Side: Hamburger */}
        <div style={styles.navbarRight}>
          {/* Hamburger Icon */}
          <div style={styles.hamburger} onClick={toggleMenu}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </div>
        </div>

        {/* Slide-in Menu */}
        {isMenuOpen && (
          <div style={styles.slideMenu}>
            <div style={styles.menuHeader}>
              <h3 style={styles.menuTitle}>Menu</h3>
            </div>

            <div style={styles.menuLinks}>
              <Link to="/about" style={styles.menuLink} onClick={closeMenu}>
                <Info size={22} />
                <div>
                  <div style={styles.menuLinkTitle}>About</div>
                  <div style={styles.menuLinkSubtitle}>Learn about our mission</div>
                </div>
              </Link>

              <Link to="/story" style={styles.menuLink} onClick={closeMenu}>
                <BookOpen size={22} />
                <div>
                  <div style={styles.menuLinkTitle}>Our Story</div>
                  <div style={styles.menuLinkSubtitle}>Journey and milestones</div>
                </div>
              </Link>

              <Link to="/events" style={styles.menuLink} onClick={closeMenu}>
                <Calendar size={22} />
                <div>
                  <div style={styles.menuLinkTitle}>Events</div>
                  <div style={styles.menuLinkSubtitle}>Upcoming activities</div>
                </div>
              </Link>

              <div style={styles.divider}></div>

              <Link to="/signin" style={styles.menuLink} onClick={closeMenu}>
                <LogIn size={22} />
                <div>
                  <div style={styles.menuLinkTitle}>Sign In</div>
                  <div style={styles.menuLinkSubtitle}>Access your account</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay */}
      {isMenuOpen && <div style={styles.overlay} onClick={closeMenu}></div>}
    </>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  navbarLeft: {
    flex: '0 0 auto',
    zIndex: 101
  },
  logo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    opacity: 1
  },
  navbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 101
  },
  hamburger: {
    cursor: 'pointer',
    color: '#1f2937',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slideMenu: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '340px',
    maxWidth: '85vw',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    animation: 'slideIn 0.3s ease-out',
    overflowY: 'auto'
  },
  menuHeader: {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
  },
  menuTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  menuLinks: {
    padding: '16px'
  },
  menuLink: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    color: '#374151',
    textDecoration: 'none',
    borderRadius: '12px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  menuLinkTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px'
  },
  menuLinkSubtitle: {
    fontSize: '13px',
    color: '#6b7280'
  },
  divider: {
    height: '1px',
    background: 'rgba(229, 231, 235, 0.3)',
    margin: '16px 0'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
    animation: 'fadeIn 0.3s ease-out'
  }
};

// Add keyframe animations and hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Hover Effects */
  a[style*="logo"]:hover {
    opacity: 0.7 !important;
    transform: translateY(-1px);
  }

  div[style*="hamburger"]:hover {
    background: rgba(0, 0, 0, 0.05) !important;
  }

  a[href="/about"]:hover,
  a[href="/story"]:hover,
  a[href="/events"]:hover,
  a[href="/signin"]:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: translateX(4px);
  }
`;

if (!document.getElementById('navbar-animations')) {
  styleSheet.id = 'navbar-animations';
  document.head.appendChild(styleSheet);
}

export default PublicNavbar;