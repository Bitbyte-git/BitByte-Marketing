import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rs. 0";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const LIST_TITLES = {
  customers: "Customer List",
  retailers: "Retailer List",
  wholesale_dealers: "Wholesale Dealer List",
  distributors: "Distributor List",
};

export default function PromotionSalesOrderList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nodeType = searchParams.get("node_type");
  const userId = searchParams.get("user_id");
  const nodeName = searchParams.get("name") || "";
  const listType = searchParams.get("list_type") || "customers";
  const orderFilter = searchParams.get("order_filter") || "all";

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

    const url =
      listType === "customers"
        ? `/promotion-customers/?node_type=${nodeType}&user_id=${userId}&order_filter=${orderFilter}`
        : `/promotion-nodes/?node_type=${nodeType}&list_type=${listType}&user_id=${userId}`;

    api
      .get(url)
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load list.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [nodeType, userId, listType, orderFilter]);

  const isCustomerMode = listType === "customers";
  const totalOrders = isCustomerMode ? rows.reduce((sum, r) => sum + (r.order_count || 0), 0) : null;
  const totalValue = rows.reduce((sum, r) => sum + (r.total_value || 0), 0);
  const totalCustomersAgg = !isCustomerMode ? rows.reduce((sum, r) => sum + (r.total_customers || 0), 0) : null;
  const pageTitle = LIST_TITLES[listType] || "List";

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
            <h1>{pageTitle}{nodeName ? ` — ${nodeName}` : ""}</h1>
            <p>
              {isCustomerMode
                ? orderFilter === "orders_only"
                  ? "Customers who placed orders, sorted by value."
                  : "Full downline customer chain (any depth) with order stats, sorted by value."
                : "Sorted by total sales value, highest first."}
            </p>
          </div>
          <button className="psl-back" onClick={() => navigate(-1)}>← Back</button>
        </div>

        {error && <div className="psl-error">{error}</div>}

        <div className="psl-stats">
          {loading ? (
            [0, 1, 2].map(i => (
              <div className="psl-stat" key={i}>
                <SkeletonText width="70%" height="10px" />
                <div style={{ marginTop: 8 }}><SkeletonText width="40%" height="26px" /></div>
              </div>
            ))
          ) : isCustomerMode ? (
            <>
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
            </>
          ) : (
            <>
              <div className="psl-stat">
                <div className="psl-stat-label">Total {pageTitle.replace(" List", "")}s</div>
                <div className="psl-stat-value">{rows.length}</div>
              </div>
              <div className="psl-stat">
                <div className="psl-stat-label">Total Customers</div>
                <div className="psl-stat-value">{totalCustomersAgg}</div>
              </div>
              <div className="psl-stat">
                <div className="psl-stat-label">Total Value</div>
                <div className="psl-stat-value">{money(totalValue)}</div>
              </div>
            </>
          )}
        </div>

        <div className="psl-card">
          <div className="psl-card-head">
            <h2>{pageTitle}</h2>
            <p>Sorted by total value, highest first.</p>
          </div>

          <div className="psl-table-wrap">
            <table className="psl-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  {isCustomerMode ? <th>Orders</th> : <th>Customers</th>}
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [0, 1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td><SkeletonText width="30px" height="12px" /></td>
                      <td><SkeletonText width="90px" height="12px" /></td>
                      <td>
                        <SkeletonText width="120px" height="13px" />
                        <div style={{ marginTop: 4 }}>
                          <SkeletonText width="140px" height="10px" />
                        </div>
                      </td>
                      <td><SkeletonText width="90px" height="12px" /></td>
                      <td><SkeletonText width="40px" height="20px" /></td>
                      <td><SkeletonText width="80px" height="12px" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr className="psl-loading-row">
                    <td colSpan={6}><div className="psl-empty">No records found.</div></td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr
                      key={r.customer_id || r.id_str || i}
                      style={["Retailer", "Wholesale Dealer", "Distributor"].includes(r.position) ? { background: "rgba(7,59,63,0.05)" } : undefined}
                    >
                      <td className="psl-pos">{isCustomerMode ? r.position : i + 1}</td>
                      <td className="psl-id">{isCustomerMode ? r.customer_id : r.id_str}</td>
                      <td>
                        <div className="psl-name">{r.name}</div>
                        <div className="psl-sub">{r.email}</div>
                      </td>
                      <td>{r.phone}</td>
                      <td><span className="psl-count-pill">{isCustomerMode ? r.order_count : r.total_customers}</span></td>
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