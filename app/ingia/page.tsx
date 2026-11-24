import { AuthForms } from "@/components/auth-forms";
import { CustomerPhoneAuth } from "@/components/customer-phone-auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; next?: string }> }) {
  const params = await searchParams;
  const isCustomerSelfService = params.next === "/dashboard/jihudumie";
  return <main className="page">
    <p className="eyebrow">{isCustomerSelfService ? "HUDUMA ZA MTEJA" : "KARIBU MAARIFABOOKS"}</p>
    <h1>{isCustomerSelfService ? "Ingia au fungua akaunti ya mteja" : "Ingia au fungua akaunti"}</h1>
    {isCustomerSelfService ? (
      <p className="muted">Jihudumie ni sehemu ya wateja wa MaarifaBooks. Ingia kwenye akaunti yako au jisajili bure ili uweze kusimamia vitabu, malipo na kupata msaada.</p>
    ) : (
      <p className="muted seller-login-entry">Wewe ni muuzaji? <a href="/muuzaji/ingia"><u>Ingia kwenye dashibodi ya muuzaji</u></a>.</p>
    )}
    {isCustomerSelfService ? (
      <CustomerPhoneAuth next={params.next} />
    ) : (
      <AuthForms error={params.error} success={params.success} next={params.next} />
    )}
  </main>;
}
