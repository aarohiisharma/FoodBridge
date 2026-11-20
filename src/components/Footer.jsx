import '../styles/components.css';

/**
 * Page footer with copyright and tagline.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__text">
          © {currentYear} FoodBridge — Reducing food waste, one meal at a time.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
