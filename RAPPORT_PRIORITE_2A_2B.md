# Peace of Mind — Priorité 2A + 2B

Date : 2026-05-01

## Fichiers modifiés
- index.html
- menu.html
- expertise.html
- collection.html
- contact.html
- qui-nous-sommes.html
- admin.html
- styles.css
- assets/booking.js

## Fichiers créés
- mentions-legales.html
- politique-confidentialite.html
- assets/config.js

## Configuration
Les endpoints publics sont centralisés dans assets/config.js :
- BOOKING_WEBHOOK_URL
- CONTACT_WEBHOOK_URL

Valeur par défaut :
- https://formsubmit.co/ajax/contact@peaceofmind-gradignan.fr

À remplacer si Formspree, Make/Zapier ou autre webhook est utilisé.

## Vérifications automatiques effectuées
- Booksy : aucune occurrence
- V1 : aucune occurrence
- Offre du moment : aucune occurrence
- POM20 : aucune occurrence
- logo-peace-of-mind.png : aucune occurrence
- logo-pom.png : aucune occurrence
- logo.png : aucune occurrence
- mailto: : aucune occurrence
- Protection front temporaire : aucune occurrence
- logo-peace-of-mind-final.png présent sur les pages nécessaires
- footer légal présent sur les pages publiques + pages légales
- admin.html non présent dans les footers/headers publics
- assets/booking.js : syntaxe contrôlée avec node --check

## Points de vigilance priorité 3
- backend réel
- authentification admin réelle
- base de données
- paiement Stripe/Revolut/Supabase
