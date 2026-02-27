import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = ["Home", "Counting Down", "Location", "RSVP"];

const Navbar = ({ childName }: { childName?: string }) => {
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
            height: "50px", // Reduced from 60px to 50px
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
              lineHeight: 1,
              marginTop: "-5px", // Adjust vertical alignment
            }}
          >
            {childName || "Katy"}
          </a>

          {/* Mobile hamburger - kept original size */}
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
            {open ? <X size={26} /> : <Menu size={26} />} {/* Kept original size */}
          </button>

          {/* Nav links - kept original sizes */}
          <ul
            style={{
              display: "flex",
              gap: "2rem", // Kept original gap
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
            className="bd-nav-links"
          >
            {navLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  style={{
                    fontSize: "0.8rem", // Kept original size
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
        </div>

        {/* Mobile dropdown – rendered absolutely so it doesn't push content down */}
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
              padding: "8px 24px 12px", // Slightly reduced padding
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 0", // Reduced from 10px
                  fontSize: "0.85rem", // Kept original size
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
          padding-top: 50px; /* Reduced from 60px to match new navbar height */
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
            min-height: 45px !important; /* Reduced from 50px to 45px */
            background-color: var(--background, hsl(222, 47%, 11%)) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border-bottom: 1px solid var(--border, hsl(217, 33%, 22%)) !important;
          }
          
          /* Keep the logo and hamburger visible with reduced height */
          .bd-navbar > div {
            height: 45px !important; /* Reduced from 50px to 45px */
          }
          
          /* Adjust logo alignment on mobile */
          .bd-navbar > div > a {
            margin-top: -8px !important; /* More negative margin for mobile */
          }
          
          /* Mobile hamburger color */
          .bd-hamburger {
            color: var(--foreground, hsl(210, 40%, 98%)) !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;