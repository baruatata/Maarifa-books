import { signIn, signUp } from "@/app/auth/actions";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  return <main className="page"><p className="eyebrow">KARIBU MAARIFABOOKS</p><h1>Ingia au fungua akaunti</h1>
    {params.error && <p className="message">{params.error}</p>}{params.success && <p className="notice">{params.success}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 20 }}>
      <form className="panel form" action={signIn}><h2>Ingia</h2><div className="field"><label>Barua pepe</label><input name="email" type="email" required /></div><div className="field"><label>Nenosiri</label><input name="password" type="password" required /></div><button className="btn">Ingia</button></form>
      <form className="panel form" action={signUp}><h2>Jisajili</h2><div className="field"><label>Jina kamili</label><input name="full_name" required /></div><div className="field"><label>Namba ya simu</label><input name="phone" type="tel" /></div><div className="field"><label>Barua pepe</label><input name="email" type="email" required /></div><div className="field"><label>Nenosiri (angalau herufi 8)</label><input name="password" type="password" minLength={8} required /></div><div className="field"><label>Lugha</label><select name="preferred_language"><option value="sw">Kiswahili</option><option value="en">English</option></select></div><button className="btn">Fungua akaunti</button><p className="muted">Idhini ya matangazo ni hiari na itaombwa kando.</p></form>
    </div></main>;
}
