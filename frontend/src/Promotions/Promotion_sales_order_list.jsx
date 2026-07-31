import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rs. 0";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function PromotionSalesOrderList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nodeType = searchParams.get("node_type");
  const userId = searchParams.get("user_id");
  const nodeName = searchParams.get("name") || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!nodeType || !userId) {
      setError("Missing node_type or user_id in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api
      .get(`/promotion-customers/?node_type=${nodeType}&user_id=${userId}`)
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load customer list.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [nodeType, userId]);

  const totalOrders = rows.reduce((sum, r) => sum + r.order_count, 0);
  const totalValue = rows.reduce((sum, r) => sum + r.total_value, 0);

  return (
    <div className="psl-page">
      <style>{`
        .psl-page { min-height: 100vh; background: linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%); color: #111817; }
        .psl-shell { width: calc(100% - 48px); max-width: 1280px; margin: 0 auto; padding: 40px 0 64px; box-sizing: border-box; }
        .psl-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 26px; flex-wrap: wrap; }
        .psl-kicker { color: #073B3F; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
        .psl-header h1 { margin: 4px 0 0; color: #1a1a1a; font-family: Georgia, "Times New Roman", serif; font-size: 1.9rem; font-weight: 600; line-height: 1.1; }
        .psl-header p { margin: 6px 0 0; color: #7A8987; font-size: 13px; }
        .psl-back { padding: 11px 22px; background: #fff; border: 1px solid #D1DFDE; border-radius: 999px; color: #073B3F; font-weight: 800; font-size: 13px; cursor: pointer; transition: transform 160ms ease; }
        .psl-back:hover { transform: translateY(-2px); }
        .psl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
        .psl-stat { background: #fff; border: 1px solid #D1DFDE; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px rgba(7,59,63,0.06); }
        .psl-stat-label { color: #7A8987; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
        .psl-stat-value { margin-top: 6px; color: #073B3F; font-family: Georgia, "Times New Roman", serif; font-size: 26px; font-weight: 700; }
        .psl-card { background: #fff; border: 1px solid #D1DFDE; border-radius: 20px; padding: 8px 8px 24px; box-shadow: 0 10px 28px rgba(7,59,63,0.06); overflow: hidden; }
        .psl-card-head { padding: 22px 24px 16px; border-bottom: 1px solid #EEF0EF; }
        .psl-card-head h2 { margin: 0; color: #073B3F; font-family: Georgia, "Times New Roman", serif; font-size: 19px; font-weight: 600; }
        .psl-card-head p { margin: 5px 0 0; color: #7A8987; font-size: 12px; }
        .psl-table-wrap { overflow-x: auto; }
        .psl-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 900px; }
        .psl-table thead tr { border-bottom: 1px solid #D1DFDE; }
        .psl-table th { padding: 14px 18px; text-align: left; color: #7A8987; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
        .psl-table td { padding: 15px 18px; border-bottom: 1px solid #EEF0EF; color: #111817; white-space: nowrap; }
        .psl-table tr:last-child td { border-bottom: none; }
        .psl-table tr:hover td { background: rgba(7,59,63,0.02); }
        .psl-pos { color: #073B3F; font-weight: 800; font-family: monospace; }
        .psl-id { color: #073B3F; font-family: monospace; font-weight: 700; font-size: 12.5px; }
        .psl-name { font-weight: 700; }
        .psl-sub { color: #7A8987; font-size: 12px; margin-top: 2px; }
        .psl-value { color: #073B3F; font-weight: 800; font-family: monospace; }
        .psl-count-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; padding: 3px 10px; border-radius: 999px; background: rgba(7,59,63,0.08); color: #073B3F; font-weight: 800; font-size: 12px; }
        .psl-empty { text-align: center; color: #7A8987; padding: 64px 20px; font-size: 14px; }
        .psl-error { background: rgba(201,32,53,0.08); border: 1px solid rgba(201,32,53,0.28); color: #C92035; border-radius: 12px; padding: 14px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
        .psl-loading-row td { text-align: center; color: #7A8987; padding: 40px 0; }
        @media (max-width: 900px) { .psl-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .psl-shell { width: calc(100% - 24px); } .psl-stats { grid-template-columns: 1fr; } }
      `}</style>

      <div className="psl-shell">
        <div className="psl-header">
          <div>
            <span className="psl-kicker">Promotion Detail</span>
            <h1>Customer List{nodeName ? ` — ${nodeName}` : ""}</h1>
            <p>Full downline customer chain (any depth) with order stats, sorted by value.</p>
          </div>
          <button className="psl-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {error && <div className="psl-error">{error}</div>}

        <div className="psl-stats">
          <div className="psl-stat">
            <div className="psl-stat-label">Total Customers</div>
            <div className="psl-stat-value">{rows.length}</div>
          </div>
          <div className="psl-stat">
            <div className="psl-stat-label">Total Orders</div>
            <div className="psl-stat-value">{totalOrders}</div>
          </div>
          <div className="psl-stat">
            <div className="psl-stat-label">Total Value</div>
            <div className="psl-stat-value">{money(totalValue)}</div>
          </div>
        </div>

        <div className="psl-card">
          <div className="psl-card-head">
            <h2>Customers</h2>
            <p>Sorted by total order value, highest first.</p>
          </div>

          <div className="psl-table-wrap">
            <table className="psl-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="psl-loading-row"><td colSpan={6}>Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr className="psl-loading-row">
                    <td colSpan={6}>
                      <div className="psl-empty">No customers found.</div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.customer_id} style={r.position === 'Retailer' ? { background: 'rgba(7,59,63,0.05)' } : undefined}>
                      <td className="psl-pos">{r.position}</td>
                      <td className="psl-id">{r.customer_id}</td>
                      <td>
                        <div className="psl-name">{r.name}</div>
                        <div className="psl-sub">{r.email}</div>
                      </td>
                      <td>{r.phone}</td>
                      <td><span className="psl-count-pill">{r.order_count}</span></td>
                      <td className="psl-value">{money(r.total_value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}