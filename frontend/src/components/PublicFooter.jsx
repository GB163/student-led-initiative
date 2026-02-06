import React from "react";

const PublicFooter = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        {/* Social Links with Icons */}
        <div style={styles.footerLinks}>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.socialLink}
            aria-label="Instagram"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Instagram_logo_2022.svg/1200px-Instagram_logo_2022.svg.png" 
              alt="Instagram" 
              style={styles.iconImg}
            />
          </a>
          
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.socialLink}
            aria-label="Facebook Messenger"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Facebook_Messenger_logo_2020.svg/2048px-Facebook_Messenger_logo_2020.svg.png" 
              alt="Messenger" 
              style={styles.iconImg}
            />
          </a>
          
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.socialLink}
            aria-label="X (Twitter)"
          >
            <svg style={styles.iconImg} viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          
          <a 
            href="mailto:info@example.com" 
            style={styles.socialLink}
            aria-label="Gmail"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png" 
              alt="Gmail" 
              style={styles.iconImg}
            />
          </a>
        </div>
        
        {/* Copyright */}
        <p style={styles.copyright}>&copy; {new Date().getFullYear()} Student-Led Initiative. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 24px',
    marginTop: 'auto',
    width: '100%',
    background: 'linear-gradient(135deg, #2196F3 0%, #2196F3 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  socialLink: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '8px',
    borderRadius: '50%',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px'
  },
  iconImg: {
    width: '20px',
    height: '20px',
    objectFit: 'contain'
  },
  copyright: {
    color: '#ffffff',
    fontSize: '11px',
    margin: 0,
    textAlign: 'center',
    opacity: 0.9
  }
};

// Add hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  footer a:hover {
    background: rgba(255, 255, 255, 0.15) !important;
    transform: translateY(-2px);
  }
`;

if (!document.getElementById('public-footer-styles')) {
  styleSheet.id = 'public-footer-styles';
  document.head.appendChild(styleSheet);
}

export default PublicFooter;