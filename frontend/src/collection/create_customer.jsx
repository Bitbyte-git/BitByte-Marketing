import { useState, useEffect } from "react";
import api from "../api";
import CustomerFooter from "./CustomerFooter";

const OCCUPATIONS = ["employee", "business", "others"];

const emptyForm = {
  initial: "",
  first_name: "",
  last_name: "",
  mobile_number: "",
  gender: "male",
  dob: "",
  married_status: "single",
  anniversary_date: "",
  email: "",
  password: "",
  door_no: "",
  street_name: "",
  town_name: "",
  city_name: "",
  district: "",
  state: "",
  aadhaar_no: "",
  pan_no: "",
  occupation: "",
  occupation_detail: "",
  annual_salary: "",
};

// Fake id generator — UI only, no backend yet.
function makeCustomerId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BBCUS${rand}`;
}

export default function CreateCustomer() {
  const [form, setForm] = useState(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [customers, setCustomers] = useState([]);

  // Info of the customer who is currently logged in (creating this new customer)
  const [superCustomer, setSuperCustomer] = useState(null);
  const [superCustomerLoading, setSuperCustomerLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get("/my-info/")
      .then((res) => {
        if (alive) setSuperCustomer(res.data || null);
      })
      .catch(() => {
        if (alive) setSuperCustomer(null);
      })
      .finally(() => {
        if (alive) setSuperCustomerLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const superCustomerName = superCustomer?.name || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "married_status" && value !== "married") {
      setForm({ ...form, married_status: value, anniversary_date: "" });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.married_status === "married" && !form.anniversary_date) {
      setMsg("Please enter Anniversary Date!");
      setMsgType("error");
      return;
    }

    if (form.password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // UI-only: no API call. Just push a row into the local table.
    const newCustomer = {
      ...form,
      customer_id: makeCustomerId(),
      created_at: new Date().toISOString(),
      created_by: superCustomer?.id || "—",
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setMsg("Customer created successfully!");
    setMsgType("success");
    setForm(emptyForm);
    setConfirmPassword("");
    setPasswordError("");
  };

  return (
    <div className="cc-page">
      <style>{`
        .cc-page {
          min-height: 100vh;
          background: var(--bb-bg, #FDFDFC);
          color: var(--bb-ink, #111817);
        }

        .cc-shell {
          width: calc(100% - 48px);
          max-width: 1120px;
          margin: 0 auto;
          padding: 36px 0 64px;
          box-sizing: border-box;
        }

        .cc-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .cc-kicker {
          color: var(--bb-teal-dark, #073B3F);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .cc-header h1 {
          margin: 4px 0 0;
          color: #1a1a1a;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.9rem;
          font-weight: 600;
          line-height: 1.1;
        }

        .cc-header p {
          margin: 6px 0 0;
          color: var(--bb-muted, #7A8987);
          font-size: 13px;
        }

        .cc-msg {
          border-radius: 12px;
          padding: 13px 18px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .cc-msg.success {
          background: rgba(12, 64, 68, 0.08);
          border: 1px solid rgba(12, 64, 68, 0.28);
          color: #0C4044;
        }

        .cc-msg.error {
          background: rgba(201, 32, 53, 0.08);
          border: 1px solid rgba(201, 32, 53, 0.28);
          color: #C92035;
        }

        .cc-card {
          background: #fff;
          border: 1px solid #D1DFDE;
          border-radius: 20px;
          padding: 30px 32px;
          margin-bottom: 26px;
          box-shadow: 0 10px 28px rgba(7,59,63,0.06);
        }

        .cc-section-title {
          color: var(--bb-teal-dark, #073B3F);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px;
        }

        .cc-sub-label {
          color: var(--bb-teal-dark, #073B3F);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 4px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #D1DFDE;
        }

        .cc-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 20px;
        }

        .cc-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .cc-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .cc-grid.cols-init { grid-template-columns: 0.4fr 1fr 1fr; }

        .cc-field label {
          display: block;
          color: var(--bb-muted, #7A8987);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cc-field input,
        .cc-field select {
          width: 100%;
          background: #FDFDFC;
          border: 1px solid #BDCFCE;
          border-radius: 12px;
          padding: 12px 14px;
          color: #111817;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .cc-field input:focus,
        .cc-field select:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7,59,63,0.10);
        }

        .cc-field.error input {
          border-color: #C92035;
        }

        .cc-field-error {
          color: #C92035;
          font-size: 12px;
          margin-top: 6px;
        }

        .cc-field.readonly input {
          background: #F3F3F0;
          color: #073B3F;
          font-weight: 700;
          opacity: 0.85;
          cursor: not-allowed;
        }

        .cc-field.readonly input::placeholder {
          color: #7A8987;
          font-weight: 500;
        }

        .cc-super-card {
          background: rgba(7,59,63,0.04);
          border: 1px solid rgba(7,59,63,0.18);
          border-radius: 14px;
          padding: 18px 20px 4px;
          margin-bottom: 20px;
        }

        .cc-super-note {
          margin: -8px 0 16px;
          color: var(--bb-muted, #7A8987);
          font-size: 12px;
        }

        .cc-actions {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }

        .cc-btn-primary {
          padding: 13px 30px;
          background: #073B3F;
          border: none;
          border-radius: 999px;
          font-weight: 800;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(7,59,63,0.24);
          transition: transform 160ms ease;
        }

        .cc-btn-primary:hover { transform: translateY(-2px); }

        .cc-btn-secondary {
          padding: 13px 24px;
          background: #F3F3F0;
          border: 1px solid #D1DFDE;
          border-radius: 999px;
          color: #073B3F;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .cc-table-wrap { overflow-x: auto; }

        .cc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .cc-table thead tr {
          border-bottom: 1px solid #D1DFDE;
        }

        .cc-table th {
          padding: 12px 16px;
          text-align: left;
          color: var(--bb-muted, #7A8987);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .cc-table td {
          padding: 13px 16px;
          border-bottom: 1px solid #EEF0EF;
          color: #111817;
          white-space: nowrap;
        }

        .cc-table td.id {
          color: #073B3F;
          font-family: monospace;
          font-weight: 700;
        }

        .cc-empty {
          text-align: center;
          color: var(--bb-muted, #7A8987);
          padding: 48px 0;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .cc-grid.cols-3 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .cc-shell { width: calc(100% - 24px); }
          .cc-card { padding: 22px 18px; }
          .cc-grid.cols-2,
          .cc-grid.cols-3,
          .cc-grid.cols-init { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cc-shell">
        <div className="cc-header">
          <div>
            <span className="cc-kicker">Customer Management</span>
            <h1>Create Customer</h1>
            <p>Fill in the details below to register a new customer.</p>
          </div>
        </div>

        {msg && <div className={`cc-msg ${msgType}`}>{msg}</div>}

        <div className="cc-card">
          <h2 className="cc-section-title">New Customer Details</h2>

          <form onSubmit={handleSubmit}>
            <p className="cc-sub-label">Personal Info</p>
            <div className="cc-grid cols-init">
              <div className="cc-field">
                <label>Initial</label>
                <input name="initial" value={form.initial} onChange={handleChange} maxLength={5} />
              </div>
              <div className="cc-field">
                <label>First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} required maxLength={100} />
              </div>
              <div className="cc-field">
                <label>Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} required maxLength={100} />
              </div>
            </div>

            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Mobile *</label>
                <input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Password *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>
            </div>

            <div className="cc-grid cols-3">
              <div className={`cc-field ${passwordError ? "error" : ""}`}>
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  required
                />
                {passwordError && <div className="cc-field-error">{passwordError}</div>}
              </div>
            </div>

            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="cc-field">
                <label>DOB</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} />
              </div>
              <div className="cc-field">
                <label>Married Status</label>
                <select name="married_status" value={form.married_status} onChange={handleChange}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {form.married_status === "married" && (
              <div className="cc-grid cols-3">
                <div className="cc-field">
                  <label>Anniversary Date</label>
                  <input
                    type="date"
                    name="anniversary_date"
                    value={form.anniversary_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <p className="cc-sub-label">Address</p>
            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Door No *</label>
                <input name="door_no" value={form.door_no} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Street Name *</label>
                <input name="street_name" value={form.street_name} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Town *</label>
                <input name="town_name" value={form.town_name} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>City *</label>
                <input name="city_name" value={form.city_name} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>District *</label>
                <input name="district" value={form.district} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>State *</label>
                <input name="state" value={form.state} onChange={handleChange} required />
              </div>
            </div>

            <p className="cc-sub-label">Identity</p>
            <div className="cc-grid cols-2">
              <div className="cc-field">
                <label>Aadhaar No *</label>
                <input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} required maxLength={12} />
              </div>
              <div className="cc-field">
                <label>PAN No *</label>
                <input name="pan_no" value={form.pan_no} onChange={handleChange} required maxLength={10} />
              </div>
            </div>

            <p className="cc-sub-label">Occupation</p>
            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Occupation *</label>
                <select name="occupation" value={form.occupation} onChange={handleChange} required>
                  <option value="">Select</option>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>
                      {o.charAt(0).toUpperCase() + o.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cc-field">
                <label>Detail</label>
                <input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} />
              </div>
              <div className="cc-field">
                <label>Annual Salary *</label>
                <input name="annual_salary" value={form.annual_salary} onChange={handleChange} required />
              </div>
            </div>

            <p className="cc-sub-label">Super Customer Info</p>
            <div className="cc-super-card">
              <p className="cc-super-note">
                Details of the customer who is currently logged in and creating this new customer.
              </p>
              <div className="cc-grid cols-3">
                <div className="cc-field readonly">
                  <label>Customer ID</label>
                  <input
                    value={superCustomerLoading ? "Fetching..." : superCustomer?.id || ""}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
                <div className="cc-field readonly">
                  <label>Name</label>
                  <input
                    value={superCustomerLoading ? "Fetching..." : superCustomerName}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
                <div className="cc-field readonly">
                  <label>Mobile Number</label>
                  <input
                    value={superCustomerLoading ? "Fetching..." : superCustomer?.phone || ""}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
              </div>
            </div>

            <div className="cc-actions">
              <button type="submit" className="cc-btn-primary">
                Create Customer
              </button>
              <button
                type="button"
                className="cc-btn-secondary"
                onClick={() => {
                  setForm(emptyForm);
                  setConfirmPassword("");
                  setPasswordError("");
                  setMsg("");
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="cc-card">
          <h2 className="cc-section-title">Created Customers ({customers.length})</h2>

          {customers.length === 0 ? (
            <div className="cc-empty">No customers created yet.</div>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>City</th>
                    <th>Created By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td className="id">{c.customer_id}</td>
                      <td>{c.first_name}</td>
                      <td>{c.last_name}</td>
                      <td>{c.email}</td>
                      <td>{c.mobile_number}</td>
                      <td>{c.city_name}</td>
                      <td>{c.created_by}</td>
                      <td>{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CustomerFooter />
    </div>
  );
}