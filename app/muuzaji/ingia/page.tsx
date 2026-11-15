import { signIn } from "@/app/auth/actions";
import { PasswordField } from "@/components/password-field";

export default async function SellerLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="page">
    <p className="eyebrow">MAARIFABOOKS / WAUZAJI</p>
    <h1>Ingia kwenye akaunti ya muuzaji</h1>
    <p className="lead">Tumia barua pepe na nenosiri ulilosajili. Dashibodi ya muuzaji hufunguliwa baada ya ombi lako kuidhinishwa na Admin.</p>
    {params.error && <p className="message">{params.error}</p>}
    <form className="panel form seller-login-form" action={signIn}>
      <h2>Login ya muuzaji</h2>
      <div className="field"><label htmlFor="seller-login-email">Barua pepe</label><input id="seller-login-email" name="email" type="email" autoComplete="email" required /></div>
      <PasswordField name="password" label="Nenosiri" />
      <button className="btn">Ingia kama muuzaji</button>
      <p className="muted">Bado hujafungua akaunti? <a href="/ingia"><u>Jisajili hapa</u></a>, kisha tuma ombi la kuwa muuzaji.</p>
    </form>
  </main>;
}
