import { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";

const navLinks = ["Home", "Counting Down", "Location", "RSVP"];

interface NavbarProps {
  childName?: string;
  isDarkMode?: boolean;
}

const Navbar = ({ childName, isDarkMode }: NavbarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className={`bd-navbar ${open ? "bd-open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 50,
          transition: "background-color 0.3s, border-bottom 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            height: "60px",
          }}
        >
          {/* Sacramento logo - kept original size */}
          <a
            href="#"
            style={{
              fontFamily: "'Sacramento', cursive",
              fontSize: "2.6rem", // Kept original size
              color: "var(--primary, hsl(43, 74%, 49%))",
              textDecoration: "none",
              lineHeight: "1.2",
            }}
          >
            {childName || "Katy"}
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Nav links - hidden on mobile */}
            <ul
              style={{
                display: "flex",
                gap: "2rem",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
              className="bd-nav-links"
            >
              {navLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--foreground, hsl(210, 40%, 98%))",
                      opacity: 0.7,
                      textDecoration: "none",
                      transition: "opacity 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLAnchorElement).style.opacity = "1";
                      (e.target as HTMLAnchorElement).style.color =
                        "var(--primary, hsl(43, 74%, 49%))";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLAnchorElement).style.opacity = "0.7";
                      (e.target as HTMLAnchorElement).style.color =
                        "var(--foreground, hsl(210, 40%, 98%))";
                    }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>


            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              style={{
                display: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground, hsl(210, 40%, 98%))",
              }}
              className="bd-hamburger"
            >
              {open ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "var(--card, hsl(222, 47%, 15%))",
              borderTop: "1px solid var(--border, hsl(217, 33%, 22%))",
              borderBottom: "1px solid var(--border, hsl(217, 33%, 22%))",
              padding: "8px 24px 12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 0",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--foreground, hsl(210, 40%, 98%))",
                  opacity: 0.75,
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border, hsl(217, 33%, 22%))",
                }}
              >
                {link}
              </a>
            ))}
          </div>
        )}
      </nav>


      {/* Add padding to the body to prevent content from hiding under fixed navbar */}
      <style>{`
        body {
          padding-top: 60px;
        }
        
        .bd-navbar {
          background-color: var(--background, hsl(222, 47%, 11%)) !important;
          border-bottom: 1px solid var(--border, hsl(217, 33%, 22%)) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        .bd-navbar.bd-open {
          background-color: var(--background, hsl(222, 47%, 11%)) !important;
          border-bottom: 1px solid var(--border, hsl(217, 33%, 22%)) !important;
        }

        .bd-hamburger { 
          display: none !important; 
        }
        
        .bd-nav-links { 
          display: flex !important; 
        }

        @media (max-width: 767px) {
          .bd-hamburger { 
            display: block !important; 
            color: var(--foreground, hsl(210, 40%, 98%)) !important;
          }
          
          .bd-nav-links { 
            display: none !important; 
          }
          
          /* Reduced mobile navbar height */
          .bd-navbar {
            height: auto !important;
            min-height: 55px !important;
            background-color: var(--background, hsl(222, 47%, 11%)) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border-bottom: 1px solid var(--border, hsl(217, 33%, 22%)) !important;
          }
          
          /* Keep the logo and hamburger visible with reduced height */
          .bd-navbar > div {
            height: 55px !important;
          }
          
          /* Adjust logo alignment on mobile - removed negative margin to prevent clipping */
          .bd-navbar > div > a {
            margin-top: 0 !important;
          }
          
          /* Mobile hamburger color */
          .bd-hamburger {
            color: var(--foreground, hsl(210, 40%, 98%)) !important;
          }
          
          body {
            padding-top: 55px !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;