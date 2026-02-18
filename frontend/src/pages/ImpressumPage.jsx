import React from 'react';

/**
 * Impressum Page
 * German legal requirement for website imprint
 */
const ImpressumPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-navy via-gray-900 to-midnight-navy py-16">
      <div className="container-custom mx-auto max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Impressum</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Angaben gemäß § 5 TMG</h2>
              <div className="space-y-2">
                <p>
                  <strong className="text-white">Dr. Slim Ben-Hassine</strong>
                </p>
                <p>Am Bödinger Hof 15</p>
                <p>53773 Hennef</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Kontakt</h2>
              <div className="space-y-2">
                <p>
                  <strong className="text-white">Telefon:</strong>{' '}
                  <a href="tel:+491732727287" className="text-cyan-mist hover:text-growth-green transition-colors">
                    +49 173 2727287
                  </a>
                </p>
                <p>
                  <strong className="text-white">E-Mail:</strong>{' '}
                  <a href="mailto:support@calculateco2.eu" className="text-cyan-mist hover:text-growth-green transition-colors">
                    support@calculateco2.eu
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <div className="space-y-2">
                <p>Dr. Slim Ben-Hassine</p>
                <p>Am Bödinger Hof 15</p>
                <p>53773 Hennef</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Haftungsausschluss</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Haftung für Inhalte</h3>
                  <p className="text-sm">
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Haftung für Links</h3>
                  <p className="text-sm">
                    Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Urheberrecht</h3>
                  <p className="text-sm">
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 text-cyan-mist hover:text-growth-green transition-colors"
            >
              ← Zurück zur Startseite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpressumPage;

