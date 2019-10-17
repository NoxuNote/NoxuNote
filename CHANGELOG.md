# Changelog
Tous les changements notables pour NoxuNote seront documentées dans ce fichier.

Ce format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [1.0.2beta] - 2019-10-17
### Remerciements
Merci à Alexandre, Céline, Maêl, Camille pour leurs suggestions !
### Changements mineurs
- Implémentation du clic-droit
- Apparence de la barre d'outils du haut
- Apparence des boutons
- Mise en page globale et espacement entre les lignes
### Corrections
- Correction d'un bug qui rendait du texte blanc lors de l'exportation
- Correction de bugs lors des réglages des titres lors de la pré-impression
- (Sans titre) disparait lors du clic lors de l'enregistrement
- Le mot "équation" est remplacé par "formule"
- Le texte de l'aide est reformulé pour être plus clair
 
## [1.0.1beta] - 2019-09-12
### Nouveautés
- La fin de la note peut remonter en jusqu'en haut de l'écran
- Changement du titre de la note plus facile (pas besoin de confirmation)

### Corrections
- Les pixels blancs ne sont plus coloriés en noir pour les photos
- La page d'exportation prend par défaut la taille d'une page A4

## [1.0.0] - 2019-09-04
### Cassures
- Les tableaux des anciennes notes ne sont plus pris en charge
- Les formules des anciennes notes ne sont plus modifiables
- Le nouveau système de gestion supprime vos matières crées, mais pas les notes rangées dedans.
- Aucune note ne sera supprimée.

### Nouveautés
- Nouveau gestionnaire de notes
- Nouvel editeur de texte, basé sur un traitement de texte.
- Nouvel éditeur de tableaux à la souris
- Editeur de formules
- Système d'import/export de notes au format .zip
- Nouveau système de suggestions de mots
- Nouveau module d'insertion d'image

### Nouveautés techniques
- Implémentation complète en TypeScript
- Installeur Windows NSIS plus traditionnel, aussi plus stable
- Installeur .DMG pour mac et archive ZIP pour Linux.