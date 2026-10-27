
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const resourceIcons = {
  "Study Room": "📚",
  Laboratory: "💻",
  "Meeting Room": "👥",
};

function App() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load resources from the backend
  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/resources`);

        if (!response.ok) {
          throw new Error("Could not load campus resources.");
        }

        const data = await response.json();
        setResources(data);
      } catch (err) {
        console.error("Error loading resources:", err);
        setError(
          "Unable to load resources. Please check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  // Load submitted bookings from the backend
  async function loadBookings() {
    try {
      setBookingsLoading(true);
      setBookingsError("");

      const response = await fetch(`${API_URL}/bookings`);

      if (!response.ok) {
        throw new Error("Could not load bookings.");
      }

      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setBookingsError(
        "Unable to load bookings. Please check the booking API."
      );
    } finally {
      setBookingsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  // Filter resources by search text and category
  const filteredResources = resources.filter((resource) => {
    const searchText =
      `${resource.name} ${resource.location} ${resource.type}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesCategory =
      category === "All" || resource.type === category;

    return matchesSearch && matchesCategory;
  });

  // Format today's date using the local calendar
  function getToday() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  // Select a resource and scroll to the booking form
  function chooseResource(resource) {
    setSelected(resource);
    setMessage("");

    document.getElementById("booking")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  // Submit the booking to the Express API
  async function handleBooking(event) {
    event.preventDefault();
    setMessage("");

    if (submitting) return;

    if (!selected || !date || !startTime || !endTime) {
      setMessage("Please complete all booking details.");
      return;
    }

    if (date < getToday()) {
      setMessage("Please choose today or a future date.");
      return;
    }

    if (startTime >= endTime) {
      setMessage("End time must be later than start time.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId: selected._id,
          bookingDate: date,
          startTime,
          endTime,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to submit booking.");
        return;
      }

      setMessage(
        `Booking request submitted successfully! Status: ${result.booking.status}.`
      );
      await loadBookings();
    } catch (err) {
      console.error("Booking submission error:", err);
      setMessage(
        "Cannot contact the server. Check that the backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">SC</span>
          <span>
            Campus<span className="brand-light">Space</span>
          </span>
        </a>

        <nav>
          <a className="nav-active" href="#home">Dashboard</a>
          <a href="#resources">Resources</a>
          <a href="#booking">Book a Resource</a>
        </nav>

        <div className="user-badge">
          <span>●</span> Student Portal
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              SMART CAMPUS · RESOURCE MANAGEMENT
            </span>

            <h1>
              Your campus.
              <br />
              Your space. <span>Your time.</span>
            </h1>

            <p>
              Find and book the perfect campus space for studying,
              collaboration, and creating something great.
            </p>

            <a className="primary-button" href="#resources">
              Explore resources <span>→</span>
            </a>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-circle circle-one"></div>
            <div className="art-circle circle-two"></div>

            <div className="art-card">
              <span className="art-symbol">⌂</span>
              <span className="art-caption">YOUR SPACE AWAITS</span>
              <div className="art-line"></div>
              <div className="art-line short"></div>
              <div className="art-dots">
                <i></i>
                <i></i>
                <i></i>
              </div>
            </div>

            <div className="floating-tag">✦ Find your focus</div>
          </div>
        </section>

        <section className="stats">
          <div>
            <span className="stat-icon">▦</span>
            <div>
              <strong>{resources.length}</strong>
              <span>Total resources</span>
            </div>
          </div>

          <div>
            <span className="stat-icon">⌖</span>
            <div>
              <strong>
                {new Set(resources.map((resource) => resource.type)).size}
              </strong>
              <span>Resource categories</span>
            </div>
          </div>

          <div>
            <span className="stat-icon">◷</span>
            <div>
              <strong>Easy</strong>
              <span>Booking experience</span>
            </div>
          </div>
        </section>

        <section className="resources-section" id="resources">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DISCOVER YOUR SPACE</span>
              <h2>Campus resources</h2>
              <p>
                Explore spaces designed to help you do your best work.
              </p>
            </div>

            <span className="result-count">
              {loading
                ? "Loading spaces..."
                : `${filteredResources.length} spaces found`}
            </span>
          </div>

          <div className="filters">
            <div className="search-box">
              <span>⌕</span>
              <input
                aria-label="Search resources"
                placeholder="Search by name, location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="category-filters">
              {["All", "Study Room", "Laboratory", "Meeting Room"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item ? "filter active" : "filter"
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item === "All" ? "All spaces" : item}
                  </button>
                )
              )}
            </div>
          </div>

          {loading && (
            <p className="empty-state">Loading campus resources...</p>
          )}

          {!loading && error && (
            <p className="empty-state" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="resource-grid">
              {filteredResources.map((resource, index) => (
                <article className="resource-card" key={resource._id}>
                  <div className={`resource-art art-${(index % 6) + 1}`}>
                    <span className="resource-emoji">
                      {resourceIcons[resource.type] || "🏫"}
                    </span>

                    <span className="available-label">
                      <i></i> Listed
                    </span>
                  </div>

                  <div className="resource-details">
                    <span className="resource-type">{resource.type}</span>
                    <h3>{resource.name}</h3>

                    <p className="resource-location">
                      ⌖ {resource.location}
                    </p>

                    <div className="resource-footer">
                      <span>♙ Capacity: {resource.capacity}</span>

                      <button
                        type="button"
                        onClick={() => chooseResource(resource)}
                      >
                        Book space <span>→</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {filteredResources.length === 0 && (
                <p className="empty-state">
                  No resources match your search. Try another keyword or category.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="resources-section" id="my-bookings">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR RESERVATIONS</span>
              <h2>My bookings</h2>
              <p>View booking requests submitted through CampusSpace.</p>
            </div>
            <button
              className="filter"
              type="button"
              onClick={loadBookings}
              disabled={bookingsLoading}
            >
              {bookingsLoading ? "Refreshing..." : "Refresh bookings"}
            </button>
          </div>

          {bookingsLoading && bookings.length === 0 && (
            <p className="empty-state">Loading bookings...</p>
          )}

          {bookingsError && (
            <p className="empty-state" role="alert">{bookingsError}</p>
          )}

          {!bookingsLoading && !bookingsError && bookings.length === 0 && (
            <p className="empty-state">
              No bookings found yet. Submit a booking request to see it here.
            </p>
          )}

          {bookings.length > 0 && (
            <div className="resource-grid">
              {bookings.map((booking) => {
                const resourceName =
                  booking.resource?.name || "Campus resource";
                const bookingDate = booking.bookingDate
                  ? String(booking.bookingDate).slice(0, 10)
                  : "Date unavailable";

                return (
                  <article className="resource-card booking-card" key={booking._id}>
                    <div className="resource-art art-1">
                      <span className="resource-emoji">🗓️</span>
                      <span className="available-label">
                        <i></i> {booking.status || "Pending"}
                      </span>
                    </div>
                    <div className="resource-details">
                      <span className="resource-type">
                        {booking.resource?.type || "Resource booking"}
                      </span>
                      <h3>{resourceName}</h3>
                      <p className="resource-location">
                        ⌖ {booking.resource?.location || "Campus"}
                      </p>
                      <div className="booking-record-details">
                        <p><strong>Date:</strong> {bookingDate}</p>
                        <p>
                          <strong>Time:</strong> {booking.startTime}–{booking.endTime}
                        </p>
                        <p><strong>Status:</strong> {booking.status || "Pending"}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="booking-section" id="booking">
          <div className="booking-intro">
            <span className="eyebrow">MAKE IT YOURS</span>

            <h2>
              Reserve your
              <br />
              <span>next great idea.</span>
            </h2>

            <p>
              Choose your preferred space, date, and time. Your booking
              request will be submitted to the server.
            </p>

            <div className="booking-note">
              ✦
              <span>
                Booking requests are checked for overlapping reservations.
              </span>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <h3>Booking details</h3>

            <label>
              Choose a resource
              <select
                value={selected?._id || ""}
                onChange={(event) => {
                  const resource = resources.find(
                    (item) => item._id === event.target.value
                  );

                  setSelected(resource || null);
                  setMessage("");
                }}
                required
              >
                <option value="">Select a campus space</option>

                {resources.map((resource) => (
                  <option key={resource._id} value={resource._id}>
                    {resource.name} — {resource.type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Booking date
              <input
                type="date"
                value={date}
                min={getToday()}
                onChange={(event) => {
                  setDate(event.target.value);
                  setMessage("");
                }}
                required
              />
            </label>

            <div className="time-row">
              <label>
                Start time
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setMessage("");
                  }}
                  required
                />
              </label>

              <label>
                End time
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setMessage("");
                  }}
                  required
                />
              </label>
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={submitting || loading || Boolean(error)}
            >
              {submitting ? "Submitting..." : "Request booking"}
              {!submitting && <span>→</span>}
            </button>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
          </form>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">SC</span>
          <span>
            Campus<span className="brand-light">Space</span>
          </span>
        </a>

        <p>Smart Campus Resource Booking System · Academic project</p>

        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}

export default App;
