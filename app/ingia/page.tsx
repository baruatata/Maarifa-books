import { AuthForms } from "@/components/auth-forms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  return <main className="page">
    <p className="eyebrow">KARIBU MAARIFABOOKS</p>
    <h1>Ingia au fungua akaunti</h1>
    <p className="muted seller-login-entry">Tayari ni muuzaji? <a href="/muuzaji/ingia"><u>Ingia kwenye dashibodi ya muuzaji</u></a>.</p>
    <AuthForms error={params.error} success={params.success} />
  </main>;
}
