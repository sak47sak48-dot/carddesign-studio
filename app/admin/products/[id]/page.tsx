"use client";
import { useParams } from "next/navigation";
import ProductForm from "../../../../components/admin/ProductForm";
export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <ProductForm productId={id} />;
}
