import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import ThemeProvider from '../components/ThemeProvider';
import { SearchProvider } from '../components/SearchContext'; // ← ajout
import { AuthProvider } from '../components/AuthProvider';
import { ToastProvider } from '../components/ToastContext';

import Script from "next/script";
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({ 
  subsets: ["latin"], 
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Service d'Anatomie Pathologique",
  description: "Plateforme d'anatomie pathologique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <link 
          href="/polices/material-symbols.css" 
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-body text-on-surface antialiased`}>
        <div
          className="fixed inset-0 -z-20 pointer-events-none"
          style={{
            backgroundImage: `url('/assets/bg-lobby.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="fixed inset-0 -z-20 bg-white/60 pointer-events-none" />
        <ThemeProvider>
          <AuthProvider>
            <SearchProvider>  {/* ← ajout */}
              <ToastProvider>
                <div className="grain-overlay"></div>
                {children}
              </ToastProvider>
            </SearchProvider>
          </AuthProvider>
        </ThemeProvider>
      
        {/* Onglet caché : toute interrogation répétée (toutes les 5 s ou plus) ne
            tourne plus qu'une fois toutes les 2 minutes, et reprend normalement au
            retour sur l'onglet. Tous les postes du CHU sortent par la même adresse
            IP : cumulées, ces interrogations faisaient bloquer la passerelle par le
            pare-feu de l'hébergeur (test « Just a moment… », 429) — connexion,
            envois et messagerie impossibles. Les horloges (1 s) ne sont pas touchées. */}
        <Script id="chu-onglet-cache" strategy="beforeInteractive">
          {`(function(){if(window.__chuOngletCache)return;window.__chuOngletCache=1;var origine=window.setInterval,PAS_CACHE=120000;window.setInterval=function(action,ms){if(typeof action!=='function'||!(ms>=5000))return origine.apply(window,arguments);var args=[].slice.call(arguments,2),dernier=0;return origine.call(window,function(){var t=Date.now();if(document.hidden&&t-dernier<PAS_CACHE)return;dernier=t;return action.apply(this,args);},ms);};})();`}
        </Script>
        {/* Point « serveur prêt » de l'en-tête (comme la consultation externe) :
            déduit des vraies requêtes vers le serveur, jamais d'un ping dédié. */}
        <Script id="chu-etat-serveur" strategy="beforeInteractive">
          {`(function(){if(window.__chuServeur)return;var etat={pret:false};window.__chuServeur=etat;function maj(ok){if(etat.pret===ok)return;etat.pret=ok;window.dispatchEvent(new Event('chu-serveur'));}function suivie(u){try{var url=new URL(String(u),location.href);if(url.pathname.indexOf('/messagerie/widget.js')>=0)return false;return url.origin!==location.origin||url.pathname.indexOf('/api/')===0;}catch(e){return false;}}function verdict(s){return s>0&&s<500&&s!==429;}var f=window.fetch;if(f){window.fetch=function(i){var u=typeof i==='string'?i:(i&&i.url)||String(i);var p=f.apply(this,arguments);if(suivie(u))p.then(function(r){maj(verdict(r.status));},function(e){if(!(e&&e.name==='AbortError'))maj(false);});return p;};}var X=XMLHttpRequest.prototype,op=X.open,se=X.send;X.open=function(m,u){this.__chuUrl=u;return op.apply(this,arguments);};X.send=function(){var x=this;if(suivie(x.__chuUrl)){x.addEventListener('abort',function(){x.__chuAbandon=1;});x.addEventListener('loadend',function(){if(!x.__chuAbandon)maj(verdict(x.status));});}return se.apply(this,arguments);};})();`}
        </Script>
        {/* Messagerie du CHU : bulle en bas à droite (service-messagerie, via la passerelle). */}
        {process.env.NEXT_PUBLIC_GATEWAY_URL ? (
          // Chargée par un petit script qui réessaie : si la passerelle refuse le
          // chargement (blocage momentané), la bulle n'était jamais affichée.
          // Le jeton de l'anapath est dans un cookie httpOnly que la bulle ne peut
          // pas lire : il lui est donné par la route du temps réel (ws-ticket),
          // relue toutes les 5 minutes (connexion / changement de compte).
          <Script id="chu-messagerie" strategy="afterInteractive">
            {`(function(){var src=${JSON.stringify(`${process.env.NEXT_PUBLIC_GATEWAY_URL.replace(/\/+$/, "")}/messagerie/widget.js?bas=104`)},ticket=${JSON.stringify(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/anapath/notifications/ws-ticket`)},essai=0;function lireJeton(){return fetch(ticket,{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){window.__chuJetonMessagerie=(d&&d.token)||null;}).catch(function(){});}function monter(){if(window.ChuMessagerie)window.ChuMessagerie.monter({jeton:function(){return window.__chuJetonMessagerie||null;}});}function charger(){var s=document.createElement("script");s.src=src+(essai?"&essai="+essai:"");s.async=true;s.onload=function(){lireJeton().then(monter);setInterval(lireJeton,300000);};s.onerror=function(){s.remove();if(++essai<8)setTimeout(charger,Math.min(60000,5000*essai));};document.body.appendChild(s);}charger();})();`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}