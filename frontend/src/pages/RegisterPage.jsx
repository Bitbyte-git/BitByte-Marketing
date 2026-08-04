import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";

const OCCUPATIONS = ["employee", "business", "others"];

const emptyForm = {
  initial: "", first_name: "", last_name: "", mobile_number: "",
  gender: "male", dob: "", married_status: "single", anniversary_date: "",
  email: "", password: "",
  door_no: "", street_name: "", town_name: "", city_name: "",
  district: "", state: "", aadhaar_no: "", pan_no: "",
  occupation: "", occupation_detail: "", annual_salary: "",
};

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ref = searchParams.get("ref");

  const [form, setForm] = useState(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  const [referrer, setReferrer] = useState(null);
  const [referrerLoading, setReferrerLoading] = useState(true);
  const [referrerError, setReferrerError] = useState("");

  useEffect(() => {
    if (!ref) {
      setReferrerError("Invalid or missing referral link.");
      setReferrerLoading(false);
      return;
    }
    api
      .get(`/referrer-info/?ref=${ref}`)
      .then((res) => setReferrer(res.data))
      .catch(() => setReferrerError("Invalid referral link. Please check the URL."))
      .finally(() => setReferrerLoading(false));
  }, [ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "married_status" && value !== "married") {
      setForm({ ...form, married_status: value, anniversary_date: "" });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ref) {
      setMsg("Invalid referral link.");
      setMsgType("error");
      return;
    }
    if (form.married_status === "married" && !form.anniversary_date) {
      setMsg("Please enter Anniversary Date!");
      setMsgType("error");
      return;
    }
    if (form.password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, ref };
      if (!payload.dob) delete payload.dob;
      if (payload.married_status !== "married") delete payload.anniversary_date;

      await api.post("/public-register-customer/", payload);

      setMsg("Registration successful! You can now sign in.");
      setMsgType("success");
      setForm(emptyForm);
      setConfirmPassword("");
      setPasswordError("");
    } catch (err) {
      setMsg("Error: " + JSON.stringify(err.response?.data || err.message));
      setMsgType("error");
    }
    setSubmitting(false);
  };

  return (
    <div className="rg-page">
      <style>{`
        .rg-page { min-height: 100vh; background: #FDFDFC; color: #111817; }
        .rg-shell { width: calc(100% - 48px); max-width: 900px; margin: 0 auto; padding: 40px 0 64px; box-sizing: border-box; }
        .rg-header { margin-bottom: 22px; }
        .rg-kicker { color: #073B3F; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
        .rg-header h1 { margin: 4px 0 0; color: #1a1a1a; font-family: Georgia, serif; font-size: 1.9rem; font-weight: 600; }
        .rg-header p { margin: 6px 0 0; color: #7A8987; font-size: 13px; }
        .rg-msg { border-radius: 12px; padding: 13px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
        .rg-msg.success { background: rgba(12,64,68,0.08); border: 1px solid rgba(12,64,68,0.28); color: #0C4044; }
        .rg-msg.error { background: rgba(201,32,53,0.08); border: 1px solid rgba(201,32,53,0.28); color: #C92035; }
        .rg-card { background: #fff; border: 1px solid #D1DFDE; border-radius: 20px; padding: 30px 32px; margin-bottom: 26px; box-shadow: 0 10px 28px rgba(7,59,63,0.06); }
        .rg-sub-label { color: #073B3F; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin: 4px 0 14px; padding-bottom: 10px; border-bottom: 1px solid #D1DFDE; }
        .rg-grid { display: grid; gap: 16px; margin-bottom: 20px; }
        .rg-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .rg-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .rg-grid.cols-init { grid-template-columns: 0.4fr 1fr 1fr; }
        .rg-field label { display: block; color: #7A8987; font-size: 12px; font-weight: 700; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.04em; }
        .rg-field input, .rg-field select { width: 100%; background: #FDFDFC; border: 1px solid #BDCFCE; border-radius: 12px; padding: 12px 14px; color: #111817; font-size: 14px; outline: none; box-sizing: border-box; }
        .rg-field input:focus, .rg-field select:focus { border-color: #073B3F; box-shadow: 0 0 0 3px rgba(7,59,63,0.10); }
        .rg-field.error input { border-color: #C92035; }
        .rg-field-error { color: #C92035; font-size: 12px; margin-top: 6px; }
        .rg-field.readonly input { background: #F3F3F0; color: #073B3F; font-weight: 700; opacity: 0.85; cursor: not-allowed; }
        .rg-referral-card { background: rgba(7,59,63,0.04); border: 1px solid rgba(7,59,63,0.18); border-radius: 14px; padding: 18px 20px 4px; margin-bottom: 20px; }
        .rg-referral-note { margin: -8px 0 16px; color: #7A8987; font-size: 12px; }
        .rg-actions { display: flex; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
        .rg-btn-primary { padding: 13px 30px; background: #073B3F; border: none; border-radius: 999px; font-weight: 800; color: #fff; font-size: 14px; cursor: pointer; box-shadow: 0 14px 30px rgba(7,59,63,0.24); }
        .rg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .rg-btn-signin { padding: 13px 30px; background: #F3F3F0; border: 1px solid #D1DFDE; border-radius: 999px; color: #073B3F; font-size: 14px; font-weight: 700; cursor: pointer; }
        .rg-error-card {
          background: #fff;
          border: 1px solid rgba(201,32,53,0.18);
          border-radius: 20px;
          padding: 48px 40px;
          text-align: center;
          box-shadow: 0 10px 28px rgba(201,32,53,0.06);
        }
        .rg-error-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: rgba(201,32,53,0.08);
          border: 1px solid rgba(201,32,53,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rg-error-title {
          margin: 0 0 10px;
          color: #C92035;
          font-family: Georgia, serif;
          font-size: 22px;
          font-weight: 700;
        }
        .rg-error-text {
          margin: 0 0 24px;
          color: #7A8987;
          font-size: 14px;
          line-height: 1.6;
          max-width: 420px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (max-width: 640px) {
          .rg-shell { width: calc(100% - 24px); }
          .rg-card { padding: 22px 18px; }
          .rg-grid.cols-2, .rg-grid.cols-3, .rg-grid.cols-init { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rg-shell">
        <div className="rg-header">
          <span className="rg-kicker">Customer Registration</span>
          <h1>Create Your Account</h1>
          <p>Fill in your details below to register as a customer.</p>
        </div>

        {referrerLoading ? (
          <div className="rg-card"><p style={{ textAlign: "center", color: "#7A8987" }}>Loading...</p></div>
        ) : referrerError ? (
          <div className="rg-error-card">
            <div className="rg-error-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="rg-error-title">
              {referrerError.includes("already been used") ? "Link Already Used" : "Invalid Link"}
            </h3>
            <p className="rg-error-text">
              {referrerError.includes("already been used")
                ? "This registration link has already been used to create an account. Please ask for a new invite link to continue."
                : "This registration link is invalid or has expired. Please check the URL or request a new link."}
            </p>
            <button className="rg-btn-signin" onClick={() => navigate("/login")}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            {msg && <div className={`rg-msg ${msgType}`}>{msg}</div>}

            <div className="rg-card">
              <form onSubmit={handleSubmit}>
                <p className="rg-sub-label">Personal Info</p>
                <div className="rg-grid cols-init">
                  <div className="rg-field">
                    <label>Initial</label>
                    <input name="initial" value={form.initial} onChange={handleChange} maxLength={5} />
                  </div>
                  <div className="rg-field">
                    <label>First Name *</label>
                    <input name="first_name" value={form.first_name} onChange={handleChange} required maxLength={100} />
                  </div>
                  <div className="rg-field">
                    <label>Last Name *</label>
                    <input name="last_name" value={form.last_name} onChange={handleChange} required maxLength={100} />
                  </div>
                </div>

                <div className="rg-grid cols-3">
                  <div className="rg-field">
                    <label>Mobile *</label>
                    <input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required />
                  </div>
                  <div className="rg-field">
                    <label>Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div className="rg-field">
                    <label>Password *</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} required />
                  </div>
                </div>

                <div className="rg-grid cols-3">
                  <div className={`rg-field ${passwordError ? "error" : ""}`}>
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                      required
                    />
                    {passwordError && <div className="rg-field-error">{passwordError}</div>}
                  </div>
                </div>

                <div className="rg-grid cols-3">
                  <div className="rg-field">
                    <label>Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="rg-field">
                    <label>DOB</label>
                    <input type="date" name="dob" value={form.dob} onChange={handleChange} />
                  </div>
                  <div className="rg-field">
                    <label>Married Status</label>
                    <select name="married_status" value={form.married_status} onChange={handleChange}>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {form.married_status === "married" && (
                  <div className="rg-grid cols-3">
                    <div className="rg-field">
                      <label>Anniversary Date</label>
                      <input type="date" name="anniversary_date" value={form.anniversary_date} onChange={handleChange} />
                    </div>
                  </div>
                )}

                <p className="rg-sub-label">Address</p>
                <div className="rg-grid cols-3">
                  <div className="rg-field"><label>Door No *</label><input name="door_no" value={form.door_no} onChange={handleChange} required /></div>
                  <div className="rg-field"><label>Street Name *</label><input name="street_name" value={form.street_name} onChange={handleChange} required /></div>
                  <div className="rg-field"><label>Town *</label><input name="town_name" value={form.town_name} onChange={handleChange} required /></div>
                  <div className="rg-field"><label>City *</label><input name="city_name" value={form.city_name} onChange={handleChange} required /></div>
                  <div className="rg-field"><label>District *</label><input name="district" value={form.district} onChange={handleChange} required /></div>
                  <div className="rg-field"><label>State *</label><input name="state" value={form.state} onChange={handleChange} required /></div>
                </div>

                <p className="rg-sub-label">Identity</p>
                <div className="rg-grid cols-2">
                  <div className="rg-field"><label>Aadhaar No *</label><input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} required maxLength={12} /></div>
                  <div className="rg-field"><label>PAN No *</label><input name="pan_no" value={form.pan_no} onChange={handleChange} required maxLength={10} /></div>
                </div>

                <p className="rg-sub-label">Occupation</p>
                <div className="rg-grid cols-3">
                  <div className="rg-field">
                    <label>Occupation *</label>
                    <select name="occupation" value={form.occupation} onChange={handleChange} required>
                      <option value="">Select</option>
                      {OCCUPATIONS.map((o) => (
                        <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="rg-field"><label>Detail</label><input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} /></div>
                  <div className="rg-field"><label>Annual Salary *</label><input name="annual_salary" value={form.annual_salary} onChange={handleChange} required /></div>
                </div>

                <p className="rg-sub-label">Referral Info</p>
                <div className="rg-referral-card">
                  <p className="rg-referral-note">You were referred by this person.</p>
                  <div className="rg-grid cols-3">
                    <div className="rg-field readonly">
                      <label>ID</label>
                      <input value={referrer?.id || ""} readOnly />
                    </div>
                    <div className="rg-field readonly">
                      <label>Name</label>
                      <input value={referrer?.name || ""} readOnly />
                    </div>
                    <div className="rg-field readonly">
                      <label>Phone Number</label>
                      <input value={referrer?.phone || ""} readOnly />
                    </div>
                  </div>
                </div>

                <div className="rg-actions">
                  <button type="submit" className="rg-btn-primary" disabled={submitting}>
                    {submitting ? "Submitting..." : "Register"}
                  </button>
                  <button type="button" className="rg-btn-signin" onClick={() => navigate("/login")}>
                    Sign In
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}