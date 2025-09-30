import { useEffect, useState } from "react";

export default function TesterDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("gldms_user");
    setUser(raw ? JSON.parse(raw) : null);
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Tester Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome {user?.userName ? user.userName : "Tester"}!
          </p>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2>My Actions</h2>
          <ul>
            <li>View assigned test requests</li>
            <li>Record test results</li>
            <li>Update sample status</li>
          </ul>
        </section>

        <section style={styles.card}>
          <h2>My Info</h2>
          <p><b>Role:</b> {user?.userType}</p>
          <p><b>Email:</b> {user?.email || "—"}</p>
          <p><b>Phone:</b> {user?.phone || "—"}</p>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f6f7fb" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    background: "#111827",
    color: "white",
  },
  title: { margin: 0, fontSize: 22 },
  subtitle: { margin: "6px 0 0 0", opacity: 0.85 },
  main: {
    maxWidth: 1000,
    margin: "20px auto",
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    padding: "0 16px 24px",
  },
  card: {
    background: "white",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
    padding: 16,
  },
};
