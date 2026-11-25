import { AuthForms } from "@/components/auth-forms";
import { CustomerPhoneAuth } from "@/components/customer-phone-auth";
import { LanguageText } from "@/components/language-provider";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; next?: string }> }) {
  const params = await searchParams;
  const isCustomerSelfService = params.next === "/dashboard/jihudumie";
  return <main className="page">
    <p className="eyebrow">{isCustomerSelfService ? <LanguageText sw="HUDUMA ZA MTEJA" en="CUSTOMER SERVICES"/> : <LanguageText sw="KARIBU MAARIFABOOKS" en="WELCOME TO MAARIFABOOKS"/>}</p>
    <h1>{isCustomerSelfService ? <LanguageText sw="Ingia au fungua akaunti ya mteja" en="Sign in or create a customer account"/> : <LanguageText sw="Ingia au fungua akaunti" en="Sign in or create an account"/>}</h1>
    {isCustomerSelfService ? (
      <p className="muted"><LanguageText sw="Jihudumie ni sehemu ya wateja wa MaarifaBooks. Ingia kwenye akaunti yako au jisajili bure ili uweze kusimamia vitabu, malipo na kupata msaada." en="Self-service is the customer area of MaarifaBooks. Sign in or register for free to manage your books, payments, and support requests."/></p>
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
