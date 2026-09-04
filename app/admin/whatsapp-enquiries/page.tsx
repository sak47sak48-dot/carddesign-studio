"use client";
import StatusTablePage from "../../../components/admin/StatusTablePage";
export default function WhatsAppEnquiriesPage() {
  return <StatusTablePage eyebrow="Support" title="WhatsApp Enquiries" description="Track customer WhatsApp/contact requests from first enquiry through resolution." table="whatsapp_enquiries" select="id,customer_name,phone,email,topic,message,status,created_at" statuses={["new","contacted","resolved","closed"]} columns={[
    { key: "customer_name", label: "Customer", render: (r) => <div><p className="font-bold">{String(r.customer_name ?? "Unknown")}</p><p className="text-xs text-[#756B67]">{String(r.phone ?? r.email ?? "")}</p></div> },
    { key: "topic", label: "Topic" },
    { key: "message", label: "Message", render: (r) => <p className="max-w-lg line-clamp-2 text-[#5E5551]">{String(r.message)}</p> },
  ]} />;
}
