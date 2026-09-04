"use client";
import StatusTablePage from "../../../components/admin/StatusTablePage";
export default function CustomizationRequestsPage() {
  return <StatusTablePage eyebrow="Design workflow" title="Customization Requests" description="Review invitation customization briefs and move each request through the proof/approval workflow." table="customization_requests" select="id,request_number,customer_name,customer_phone,bride_name,groom_name,event_date,language,status,created_at" statuses={["new","in_review","proof_ready","changes_requested","approved","completed","cancelled"]} columns={[
    { key: "request_number", label: "Request", render: (r) => <span className="font-black text-[#8B2E3F]">{String(r.request_number)}</span> },
    { key: "customer_name", label: "Customer", render: (r) => <div><p className="font-bold">{String(r.customer_name)}</p><p className="text-xs text-[#756B67]">{String(r.customer_phone ?? "")}</p></div> },
    { key: "bride_name", label: "Couple", render: (r) => <span>{String(r.bride_name ?? "—")} {r.groom_name ? `& ${String(r.groom_name)}` : ""}</span> },
    { key: "event_date", label: "Event date" },
    { key: "language", label: "Language" },
  ]} />;
}
