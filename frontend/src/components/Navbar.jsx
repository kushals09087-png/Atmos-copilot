import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { CloudSun, Bot, Map, UserRound, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function checkUser() {
      const stored = localStorage.getItem("atmos_user");
      const token = localStorage.getItem("atmos_token");
      if (stored && token) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    checkUser();
    window.addEventListener("storage", checkUser);
    window.addEventListener("atmos-auth-change", checkUser);
    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("atmos-auth-change", checkUser);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("atmos_token");
    localStorage.removeItem("atmos_user");
    setUser(null);
    window.dispatchEvent(new Event("atmos-auth-change"));
    navigate("/");
  }

  function handleMapClick(e) {
    if (location.pathname === "/weather") {
      const el = document.getElementById("map");
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark"><CloudSun size={23} /></span>
        <span>ATMOS <b>COPILOT</b></span>
      </Link>

      <nav>
        <NavLink to="/weather" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          Weather
        </NavLink>
        <NavLink to="/ai" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Bot size={16} /> AI
        </NavLink>
        <Link to="/weather#map" onClick={handleMapClick} className="nav-link">
          <Map size={16} /> Map
        </Link>
      </nav>

      <div className="nav-actions">
        <ThemeToggle />
        {user ? (
          <div className="user-profile-badge">
            <span className="user-greeting">
              <UserRound size={15} /> {user.name || user.email?.split("@")[0]}
            </span>
            <button className="btn btn-small ghost logout-btn" onClick={handleLogout} title="Log out">
              <LogOut size={14} /> Log out
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="login-link"><UserRound size={16}/> Log in</Link>
            <Link to="/signup" className="btn btn-small">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
