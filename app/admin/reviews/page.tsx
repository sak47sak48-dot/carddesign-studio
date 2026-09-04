"use client";
import StatusTablePage from "../../../components/admin/StatusTablePage";
export default function ReviewsPage() {
  return <StatusTablePage eyebrow="Trust" title="Reviews" description="Moderate customer product reviews before they become publicly visible." table="reviews" select="id,customer_name,rating,title,body,status,created_at" statuses={["pending","approved","rejected"]} columns={[
    { key: "customer_name", label: "Customer", render: (r) => <span className="font-bold">{String(r.customer_name)}</span> },
    { key: "rating", label: "Rating", render: (r) => <span className="font-black text-[#B3883A]">{"★".repeat(Number(r.rating || 0))}</span> },
    { key: "title", label: "Title" },
    { key: "body", label: "Review", render: (r) => <p className="max-w-lg line-clamp-2">{String(r.body ?? "—")}</p> },
  ]} />;
}
