import { Search, LocateFixed } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ onSearch, onLocate, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <div className="search-row">
      <form onSubmit={submit} className="search-box">
        <Search size={19}/>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Search city, area or location..."
          aria-label="Search location"
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>
      <button className="location-btn" onClick={onLocate} disabled={loading}>
        <LocateFixed size={18}/> {loading ? "Locating..." : "Use my location"}
      </button>
    </div>
  );
}
