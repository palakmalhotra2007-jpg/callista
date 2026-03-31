import { useState } from "react";
import "./Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="menu-btn" onClick={() => setOpen(!open)}>
        ☰
      </button>

      <div className={`sidebar ${open ? "open" : ""}`}>
        {/* your sidebar content */}
      </div>
    </>
  );
}