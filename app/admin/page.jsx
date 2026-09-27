import AdminDashboard from "../../frontend/pages/AdminDashboard";

export const metadata = {
  title: "لوحة تحكم الأكاديميات والاشتراكات | النظام الإداري الموحد",
  description: "التحكم الشامل في الأكاديميات المشتركة وإدارة فترات الصلاحية والاشتراكات",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
