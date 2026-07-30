import { useState, useEffect } from "react";
import api from "../api";

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rs. 0";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const STATUS_CFG = {
  none: { label: "Not Yet Eligible", color: "#7A8987", bg: "rgba(122,137,135,0.10)", border: "rgba(122,137,135,0.28)" },
  pending: { label: "Pending", color: "#CCA881", bg: "rgba(204,168,129,0.12)", border: "rgba(204,168,129,0.32)" },
  approved: { label: "Approved", color: "#0C4044", bg: "rgba(12,64,68,0.12)", border: "rgba(12,64,68,0.32)" },
  rejected: { label: "Rejected", color: "#C92035", bg: "rgba(201,32,53,0.12)", border: "rgba(201,32,53,0.32)" },
};

export default function WholesaleDealerPromotions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [confirmReject, setConfirmReject] = useState(null);

  const fetchRows = () => {
    setLoading(true);
    setError("");
    api
      .get("/wholesale-dealer-promotions/")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load wholesale dealer promotions.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const showToast = (text, type = "success") => {
    setToast(text);
    setToastType(type);
    setTimeout(() => setToast(""), 3200);
  };

  const runAction = async (userId, action) => {
    setActingId(userId);
    try {
      await api.post(`/wholesale-dealer-promotions/${userId}/action/`, { action });
      showToast(
        action === "approve" ? "Approved! Retailer promoted to Wholesale Dealer." : "Request rejected.",
        action === "approve" ? "success" : "error"
      );
      setConfirmReject(null);
      fetchRows();
    } catch (err) {
      showToast(err.response?.data?.error || "Action failed.", "error");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="rp-page">
      <style>{`
        .rp-page { min-height: 100vh; background: linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%); color: #111817; }
        .rp-shell { width: calc(100% - 48px); max-width: 1280px; margin: 0 auto; padding: 40px 0 64px; box-sizing: border-box; }
        .rp-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 26px; flex-wrap: wrap; }
        .rp-kicker { color: #073B3F; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
        .rp-header h1 { margin: 4px 0 0; color: #1a1a1a; font-family: Georgia, "Times New Roman", serif; font-size: 1.9rem; font-weight: 600; line-height: 1.1; }
        .rp-header p { margin: 6px 0 0; color: #7A8987; font-size: 13px; }
        .rp-refresh { padding: 11px 22px; background: #073B3F; border: none; border-radius: 999px; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 14px 30px rgba(7,59,63,0.20); transition: transform 160ms ease; }
        .rp-refresh:hover { transform: translateY(-2px); }
        .rp-refresh:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .rp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .rp-stat { background: #fff; border: 1px solid #D1DFDE; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px rgba(7,59,63,0.06); }
        .rp-stat-label { color: #7A8987; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
        .rp-stat-value { margin-top: 6px; color: #073B3F; font-family: Georgia, "Times New Roman", serif; font-size: 26px; font-weight: 700; }
        .rp-card { background: #fff; border: 1px solid #D1DFDE; border-radius: 20px; padding: 8px 8px 24px; box-shadow: 0 10px 28px rgba(7,59,63,0.06); overflow: hidden; }
        .rp-card-head { padding: 22px 24px 16px; border-bottom: 1px solid #EEF0EF; }
        .rp-card-head h2 { margin: 0; color: #073B3F; font-family: Georgia, "Times New Roman", serif; font-size: 19px; font-weight: 600; }
        .rp-card-head p { margin: 5px 0 0; color: #7A8987; font-size: 12px; }
        .rp-table-wrap { overflow-x: auto; }
        .rp-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 900px; }
        .rp-table thead tr { border-bottom: 1px solid #D1DFDE; }
        .rp-table th { padding: 14px 18px; text-align: left; color: #7A8987; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
        .rp-table td { padding: 15px 18px; border-bottom: 1px solid #EEF0EF; color: #111817; white-space: nowrap; }
        .rp-table tr:last-child td { border-bottom: none; }
        .rp-table tr:hover td { background: rgba(7,59,63,0.02); }
        .rp-id { color: #073B3F; font-family: monospace; font-weight: 700; font-size: 12.5px; }
        .rp-name { font-weight: 700; }
        .rp-sub { color: #7A8987; font-size: 12px; margin-top: 2px; }
        .rp-value { color: #073B3F; font-weight: 800; font-family: monospace; }
        .rp-count-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; padding: 3px 10px; border-radius: 999px; background: rgba(7,59,63,0.08); color: #073B3F; font-weight: 800; font-size: 12px; }
        .rp-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px; border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; }
        .rp-actions { display: flex; gap: 8px; }
        .rp-btn-approve, .rp-btn-reject { padding: 8px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; cursor: pointer; border: 1px solid transparent; transition: transform 140ms ease, opacity 140ms ease; }
        .rp-btn-approve:hover, .rp-btn-reject:hover { transform: translateY(-1px); }
        .rp-btn-approve:disabled, .rp-btn-reject:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .rp-btn-approve { background: #073B3F; color: #fff; }
        .rp-btn-reject { background: #fff; color: #C92035; border-color: rgba(201,32,53,0.35); }
        .rp-empty { text-align: center; color: #7A8987; padding: 64px 20px; font-size: 14px; }
        .rp-error { background: rgba(201,32,53,0.08); border: 1px solid rgba(201,32,53,0.28); color: #C92035; border-radius: 12px; padding: 14px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
        .rp-toast { position: fixed; top: 24px; right: 24px; z-index: 999; padding: 14px 22px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 18px 40px rgba(7,59,63,0.20); animation: rpToastIn 220ms ease; }
        .rp-toast.success { background: #073B3F; color: #fff; }
        .rp-toast.error { background: #C92035; color: #fff; }
        @keyframes rpToastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .rp-modal-overlay { position: fixed; inset: 0; background: rgba(17,24,23,0.55); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .rp-modal { background: #fff; border-radius: 20px; padding: 28px; width: 92%; max-width: 420px; box-shadow: 0 32px 80px rgba(17,24,23,0.3); }
        .rp-modal h3 { margin: 0 0 10px; color: #073B3F; font-family: Georgia, "Times New Roman", serif; font-size: 20px; }
        .rp-modal p { margin: 0 0 22px; color: #7A8987; font-size: 14px; line-height: 1.5; }
        .rp-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .rp-modal-cancel { padding: 10px 20px; border-radius: 999px; background: #F3F3F0; border: 1px solid #D1DFDE; color: #073B3F; font-weight: 700; font-size: 13px; cursor: pointer; }
        .rp-modal-confirm { padding: 10px 20px; border-radius: 999px; background: #C92035; border: none; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer; }
        .rp-loading-row td { text-align: center; color: #7A8987; padding: 40px 0; }
        @media (max-width: 900px) { .rp-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .rp-shell { width: calc(100% - 24px); } .rp-stats { grid-template-columns: 1fr; } }
      `}</style>

      <div className="rp-shell">
        <div className="rp-header">
          <div>
            <span className="rp-kicker">Promotions</span>
            <h1>Wholesale Dealer Promotions</h1>
            <p>
              Retailers whose created customers crossed 20+ AND total sales crossed ₹35,00,000 —
              review and approve to promote them into Wholesale Dealers (Sub Dealers).
            </p>
          </div>
          <button className="rp-refresh" onClick={fetchRows} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {error && <div className="rp-error">{error}</div>}

        <div className="rp-stats">
          <div className="rp-stat">
            <div className="rp-stat-label">Total Candidates</div>
            <div className="rp-stat-value">{rows.length}</div>
          </div>
          <div className="rp-stat">
            <div className="rp-stat-label">Pending Review</div>
            <div className="rp-stat-value">
              {rows.filter((r) => r.status === "pending" || r.status === "none").length}
            </div>
          </div>
          <div className="rp-stat">
            <div className="rp-stat-label">Approved Wholesale Dealers</div>
            <div className="rp-stat-value">{rows.filter((r) => r.status === "approved").length}</div>
          </div>
          <div className="rp-stat">
            <div className="rp-stat-label">Rejected</div>
            <div className="rp-stat-value">{rows.filter((r) => r.status === "rejected").length}</div>
          </div>
        </div>

        <div className="rp-card">
          <div className="rp-card-head">
            <h2>Eligible Retailers</h2>
            <p>Sorted by total sales value, highest first.</p>
          </div>

          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Promotor ID</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Today's Customers</th>
                  <th>Total Customers</th>
                  <th>Value</th>
                  <th>Promotion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="rp-loading-row"><td colSpan={7}>Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr className="rp-loading-row">
                    <td colSpan={7}>
                      <div className="rp-empty">No retailers eligible for wholesale dealer promotion yet.</div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.none;
                    const isFinal = r.status === "approved" || r.status === "rejected";
                    const isActing = actingId === r.user_id;

                    return (
                      <tr key={r.user_id}>
                        <td className="rp-id">{r.promotor_id}</td>
                        <td>
                          <div className="rp-name">{r.first_name} {r.last_name}</div>
                          <div className="rp-sub">{r.email}</div>
                        </td>
                        <td>{r.mobile_number}</td>
                        <td><span className="rp-count-pill">{r.today_customers}</span></td>
                        <td><span className="rp-count-pill">{r.total_customers}</span></td>
                        <td className="rp-value">{money(r.total_value)}</td>
                        <td>
                          {isFinal ? (
                            <span className="rp-status-pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                              {cfg.label}
                            </span>
                          ) : (
                            <div className="rp-actions">
                              <button className="rp-btn-approve" disabled={isActing} onClick={() => runAction(r.user_id, "approve")}>
                                {isActing ? "..." : "Approve"}
                              </button>
                              <button className="rp-btn-reject" disabled={isActing} onClick={() => setConfirmReject(r)}>
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmReject && (
        <div className="rp-modal-overlay" onClick={() => setConfirmReject(null)}>
          <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this candidate?</h3>
            <p>
              {confirmReject.first_name} {confirmReject.last_name} ({confirmReject.promotor_id}) will not
              be promoted to Wholesale Dealer.
            </p>
            <div className="rp-modal-actions">
              <button className="rp-modal-cancel" onClick={() => setConfirmReject(null)}>Cancel</button>
              <button className="rp-modal-confirm" onClick={() => runAction(confirmReject.user_id, "reject")}>Yes, Reject</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`rp-toast ${toastType}`}>{toast}</div>}
    </div>
  );
}