import { signIn, signUp } from "@/app/auth/actions";
import { PasswordField } from "@/components/password-field";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  return <main className="page"><p className="eyebrow">KARIBU MAARIFABOOKS</p><h1>Ingia au fungua akaunti</h1>
    {params.error && <p className="message">{params.error}</p>}{params.success && <p className="notice">{params.success}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 20 }}>
      <form className="panel form" action={signIn}><h2>Ingia</h2><div className="field"><label htmlFor="login-email">Barua pepe</label><input id="login-email" name="email" type="email" autoComplete="email" required /></div><PasswordField name="password" label="Nenosiri" /><button className="btn">Ingia</button></form>
      <form className="panel form" action={signUp}><h2>Jisajili</h2><div className="field"><label htmlFor="full-name">Jina kamili</label><input id="full-name" name="full_name" autoComplete="name" required /></div><div className="field"><label htmlFor="phone">Namba ya simu</label><input id="phone" name="phone" type="tel" autoComplete="tel" /></div><div className="field"><label htmlFor="signup-email">Barua pepe</label><input id="signup-email" name="email" type="email" autoComplete="email" required /></div><PasswordField name="password" label="Nenosiri (angalau herufi 8)" minLength={8} /><div className="field"><label htmlFor="preferred-language">Lugha</label><select id="preferred-language" name="preferred_language"><option value="sw">Kiswahili</option><option value="en">English</option></select></div><button className="btn">Fungua akaunti</button><p className="muted">Idhini ya matangazo ni hiari na itaombwa kando.</p></form>
    </div></main>;
}
