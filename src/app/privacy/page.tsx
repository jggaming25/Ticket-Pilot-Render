import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">
              1. Datenschutz auf einen Blick
            </h2>
            <h3 className="text-lg font-medium mb-2">Allgemeine Hinweise</h3>
            <p className="text-muted-foreground">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was
              mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
              besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
              persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              2. Verantwortliche Stelle
            </h2>
            <p className="text-muted-foreground">
              Verantwortliche Stelle für die Datenverarbeitung auf dieser Website
              ist: [Dein Name / Firmenname], [Straße und Hausnummer], [PLZ und
              Ort], E-Mail: [deine@email.de]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              3. Datenerfassung auf dieser Website
            </h2>
            <h3 className="text-lg font-medium mb-2">Server-Log-Dateien</h3>
            <p className="text-muted-foreground">
              Der Provider der Seiten erhebt und speichert automatisch
              Informationen in so genannten Server-Log-Dateien, die Ihr Browser
              automatisch an uns übermittelt. Dies sind: Browsertyp und
              Browserversion, verwendetes Betriebssystem, Referrer URL, Hostname
              des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse.
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird
              nicht vorgenommen.
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Registrierung auf dieser Website</h3>
            <p className="text-muted-foreground">
              Sie können sich auf dieser Website registrieren. Dabei werden die
              aus der Registrierung erhobenen Daten nur für die Nutzung unseres
              Angebotes verwendet. Sie können diese E-Mail-Adresse jederzeit über
              den im Registrierungsprozess bereitgestellten Link abbestellen.
              Die bei der Registrierung eingegebenen Daten werden lediglich zum
              Zwecke der Nutzung des jeweiligen Angebotes verarbeitet.
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Kontaktaufnahme</h3>
            <p className="text-muted-foreground">
              Wenn Sie uns per E-Mail oder über ein Kontaktformular kontaktieren,
              wird Ihre E-Mail-Adresse zusammen mit der Zeit des Empfanges beim
              uns gespeichert, um Ihre Anfrage zu beantworten. Diese Daten
              verwenden wir für die Abwicklung der Anfragen. Nach
              abschließender Bearbeitung werden die personenbezogenen Daten
              automatisch gelöscht, sofern keine gesetzliche
              Aufbewahrungspflicht besteht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              4. Cookies und.Session
            </h2>
            <p className="text-muted-foreground">
              Diese Website verwendet Session-Cookies für die
              Authentifizierung. Diese Cookies sind technisch notwendig und
              enthalten keine personenbezogenen Daten. Sie werden beim Verlassen
              der Sitzung automatisch gelöscht. Additionally nutzt die Website
              für den Login-Prozess Session-Tokens, die auf dem Server gespeichert
              werden und beim Verlassen der Sitzung automatisch ablaufen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              5. Externe Dienste
            </h2>
            <h3 className="text-lg font-medium mb-2">Discord OAuth</h3>
            <p className="text-muted-foreground">
              Wenn Sie sich über Discord anmelden, wird Ihre Discord-Benutzer-ID,
              Ihr Benutzername und Ihr Profilbild an Discord übermittelt. Wir
              erhalten nur die zur Authentifizierung notwendigen Daten. Es werden
              keine weiteren Daten an Discord weitergegeben.
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Resend (E-Mail-Versand)</h3>
            <p className="text-muted-foreground">
              Für den Versand von Bestätigungs-E-Mails nutzen wir den Dienst
              Resend (Resend, Inc.). Dabei wird Ihre E-Mail-Adresse an Resend
              übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO.
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Ably (Echtzeit-Nachrichten)</h3>
            <p className="text-muted-foreground">
              Für Echtzeit-Updates nutzen wir den Dienst Ably (Ably, Inc.).
              Dabei wird Ihre IP-Adresse und eine User-ID an Ably übermittelt,
              um die Echtzeit-Verbindung herzustellen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              6. Ihre Rechte
            </h2>
            <p className="text-muted-foreground">
              Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung
              und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten
              sowie das Recht auf Datenübertragbarkeit und das Recht, sich bei
              einer Aufsichtsbehörde zu beschweren. Hierzu sowie zu weiteren
              Fragen zum Thema Datenschutz können Sie sich jederzeit an uns
              wenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              7. Widerspruch gegen Werbe-E-Mails
            </h2>
            <p className="text-muted-foreground">
              Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten
              Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter
              Werbung und Informationsmaterialien wird hiermit widersprochen. Die
              Betreiber der Seiten behalten sich ausdrücklich rechtliche
              Schritte im Falle der unverlangten Zusendung von
              Werbeinformationen, etwa durch Spam-E-Mails, vor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              8. Speicherdauer
            </h2>
            <p className="text-muted-foreground">
              Personenbezogene Daten der betroffenen Person werden gesperrt oder
              gelöscht, sobald der Zweck der Speicherung entfällt. Eine
              Speicherung kann auch dann erfolgen, wenn dies durch europäische
              oder nationale Gesetzgeber in unionsrechtlichen Verordnungen,
              Gesetzen oder sonstigen Vorschriften, denen der Verantwortliche
              unterliegt, vorgesehen wurde.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
