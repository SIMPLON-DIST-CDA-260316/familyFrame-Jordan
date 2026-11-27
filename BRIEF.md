## **\*Énoncé du brief**

### **\*Contexte du projet**

🎄 **\*Mission Noël : connectez les familles, pas seulement les conteneurs !**

**\*Noël approche et une jeune startup spécialisée dans les objets connectés imagine un cadeau pour les familles éloignées : un cadre photo numérique permettant de partager des souvenirs à distance.**

**\*Le principe ? Un proche renseigne son pseudo, prend une photo depuis son smartphone et l'envoie. Quelques instants plus tard, celle-ci apparaît automatiquement sur le cadre installé chez ses parents ou grands-parents.**

**\*Pas besoin d'appeler Mamie pour lui expliquer comment actualiser la page : Socket.IO s'en charge !**

**_Avant de fabriquer un véritable objet connecté, l'entreprise souhaite valider son concept avec un MVP (Minimum Viable Product_).**

**\*Vous intégrez l'équipe chargée de développer ce prototype.**

**\*Attention : votre objectif principal n'est pas de créer une application complexe, mais d'apprendre à la conteneuriser avec Docker et Docker Compose.**

**\*Vous disposez de cinq jours pour relever le défi.**

##### **\*J1 — Prototype express avec l'IA**

**\*Votre première mission consiste à développer rapidement un MVP fonctionnel en local, sans Docker.**

**\*L'intelligence artificielle est autorisée et encouragée, à condition de l'utiliser méthodiquement : décomposer le besoin, formuler des demandes précises, intégrer progressivement le code, tester et comprendre les solutions proposées.**

**\*Stack imposée :**

- **\*pnpm, React et Vite.js ;**

- **\*Node.js, Express.js et Socket.IO ;**

- **\*MongoDB Atlas et Prisma ;**

- **\*Multer, Sharp et Cloudinary.**

**\*Fonctionnalités minimales :**

1. **\*Renseigner un pseudo depuis une interface React.**

2. **_Prendre une photo avec les fonctionnalités natives du navigateur (`input type="file"` avec `accept="image/_"`et`capture`) ou sélectionner une image existante.**

3. **\*Envoyer l'image à une route API Express utilisant Multer.**

4. **\*Contrôler le fichier côté serveur, puis le décoder et le réencoder avec Sharp pour produire une image valide.**

5. **\*Héberger l'image sur Cloudinary.**

6. **\*Enregistrer dans MongoDB son URL, son identifiant Cloudinary, le pseudo et la date d'ajout.**

7. **\*Afficher la dernière photo sur une seconde interface représentant le cadre numérique.**

8. **\*Diffuser chaque nouvelle photo en temps réel grâce à Socket.IO, sans rechargement.**

**\*Résultat attendu : un MVP fonctionnel en local dès la fin du lundi.**

##### **\*J2 à J4 — Mission DevOps : on met tout en boîte !**

**\*Votre prototype devient le support de votre apprentissage de Docker et Docker Compose.**

**\*Vous devrez progressivement :**

- **\*Conteneuriser le frontend et le backend.**

- **\*Orchestrer les services avec Docker Compose.**

- **\*Comprendre les images, conteneurs et réseaux.**

- **\*Configurer les variables d'environnement et protéger les secrets.**

- **\*Vérifier le fonctionnement et la reproductibilité de l'environnement.**

- **\*Documenter les étapes nécessaires au démarrage du projet.**

**\*Une initiation à l'intégration continue (CI) pourra compléter cette phase.**

**\*Votre défi : permettre à un autre développeur de récupérer votre projet et de le lancer facilement.**

##### **\*J5 — Opération polish : un cadeau qui prend vie !**

**\*Votre application fonctionne, vos conteneurs communiquent… mais offrir à Mamie une page blanche avec une photo au milieu, ce n'est pas très Noël !**

**\*Cette dernière journée est consacrée à la créativité, à l'amélioration de l'expérience utilisateur et à l'appropriation du code.**

**\*Quelques règles à respecter :**

- **\*La dernière photo reçue reste prioritaire à l'affichage.**

- **\*Toute nouvelle photo apparaît instantanément.**

- **\*Les anciennes photos restent consultables.**

- **\*Le pseudo accompagne chaque photo.**

**\*Pour le reste, carte blanche !**

**\*Imaginez une galerie façon Polaroid, un diaporama animé, un carrousel dynamique, un mur de souvenirs ou une ambiance de Noël.**

**\*Par exemple, votre cadre pourrait afficher la dernière photo en grand et cinq anciennes photos choisies aléatoirement, avec de jolies transitions.**

**\*Vous pouvez utiliser l'IA pour améliorer le prototype, mais vous devez comprendre les modifications, vérifier leur fonctionnement et être capables de les expliquer.**

**\*Privilégiez une expérience fluide et agréable plutôt qu'une accumulation d'effets visuels.**

##### **\*Démonstration finale**

**\*En fin de semaine, vous présenterez votre application en situation réelle :**

**\*Depuis un smartphone, un utilisateur prend une photo, renseigne son pseudo et l'envoie. Celle-ci apparaît automatiquement sur un second écran, sans actualisation.**

**\*Vous présenterez également votre environnement Docker et expliquerez le parcours de la photo, depuis son envoi jusqu'à son affichage.**

**\*Votre mission : livrer un MVP fonctionnel, conteneurisé, compréhensible et suffisamment soigné pour être offert à Noël.**

**\*Pas besoin de fabriquer le cadre physique : un navigateur en plein écran suffira. Et si Mamie reçoit sa photo sans toucher à quoi que ce soit, mission accomplie !**

### **\*Modalités pédagogiques**

**\*Le rendu est individuel, mais la collaboration est fortement encouragée :**

- **\*Travail en binôme ou en petits groupes.**

- **\*Partage d'écran et programmation en binôme (pair programming).**

- **\*Échanges de solutions et résolution collective des difficultés.**

- **\*Possibilité de travailler sur une base de code commune.**

- **\*Utilisation de l'IA comme assistant de développement et d'apprentissage.**

**\*Chaque apprenant reste responsable de son livrable et doit pouvoir expliquer les choix techniques, comprendre le code utilisé et démontrer personnellement le fonctionnement de son application.**

##### **\*Posture attendue**

**\*L'objectif n'est pas de tout réaliser seul, mais de développer sa capacité à rechercher, expérimenter, collaborer et comprendre les solutions mises en œuvre.**

**\*L'entraide est valorisée, sans se substituer à l'appropriation individuelle des compétences.**

### **\*Modalités d'évaluation**

- **\*\*\*Évaluation formative et démonstration finale.\*\***

- **\*L'évaluation porte prioritairement sur le fonctionnement du prototype, la conteneurisation et la compréhension des choix techniques.**

- **\*\*\*1. Vérification fonctionnelle\*\***

- **\*- Envoyer une photo depuis un smartphone ou un navigateur.**

- **\*- Vérifier son traitement sécurisé et son hébergement sur Cloudinary.**

- **\*- Contrôler l'enregistrement des métadonnées dans MongoDB.**

- **\*- Constater son apparition en temps réel sur le cadre, sans actualisation.**

- **\*- Vérifier la consultation des anciennes photos.**

- **\*\*\*2. Vérification Docker\*\***

- **\*- Démarrer l'application avec Docker Compose.**

- **\*- Vérifier le fonctionnement des services et leurs communications.**

- **\*- Contrôler la configuration des variables d'environnement.**

- **\*- Vérifier que le projet peut être relancé à partir des instructions fournies.**

- **\*\*\*3. Présentation et questions orales\*\***

- **\*Chaque équipe présente son prototype, les améliorations réalisées et les principales difficultés rencontrées.**

- **\*Les apprenants doivent être capables d'expliquer le rôle des technologies utilisées, le parcours d'une photo et les principes de conteneurisation.**

- **\*\*\*4. Analyse réflexive\*\***

- **\*Un court bilan individuel permet d'identifier les apprentissages, les difficultés, l'utilisation de l'IA et les compétences restant à consolider.**

- **\*\*\*Critères essentiels :\*\* application fonctionnelle, communication temps réel, persistance des données, upload sécurisé, environnement Docker reproductible et compréhension du fonctionnement.**

- **\*Les améliorations graphiques et la CI sont valorisées, mais restent facultatives.**

### **\*Critères de performance**

- **\*La réussite du projet repose sur la qualité technique, la fiabilité, la reproductibilité et l'appropriation individuelle du travail réalisé.**

- **\*\*\*1. Fiabilité\*\***

- **\*L'application fonctionne de manière stable, gère les erreurs courantes sans interruption et fournit des retours compréhensibles à l'utilisateur.**

- **\*\*\*2. Reproductibilité\*\***

- **\*L'environnement peut être reconstruit et démarré sur une autre machine avec un minimum de manipulations, sans dépendance à une configuration locale non documentée.**

- **\*\*\*3. Qualité de la configuration\*\***

- **\*Les services sont correctement isolés, communiquent entre eux et utilisent une configuration adaptée à leur environnement. Les informations sensibles restent protégées.**

- **\*\*\*4. Maintenabilité\*\***

- **\*Le code et les fichiers de configuration sont organisés, lisibles et suffisamment simples pour permettre une intervention ou une évolution ultérieure.**

- **\*\*\*5. Expérience utilisateur\*\***

- **\*L'interface est intuitive, lisible et adaptée à différents écrans. Les nouvelles photos sont mises en valeur sans perturber la consultation des souvenirs précédents.**

- **\*\*\*6. Autonomie et compréhension\*\***

- **\*Chaque apprenant sait expliquer ses choix, identifier l'origine d'un dysfonctionnement courant et proposer une démarche de résolution, même lorsque le code a été produit collectivement ou avec l'IA.**

- **\*\*\*Priorité :\*\* la reproductibilité, la fiabilité et la compréhension technique priment sur la sophistication graphique.**

PARTIE 2 :

# 🎄 FamilyFrame 2.0 — Une famille, un cadre !

Votre prototype a convaincu le client ! Mais Mamie Dupont n'a pas forcément envie de recevoir les photos de la famille Martin…

Voici quelques pistes d'amélioration pour faire évoluer votre application existante.

## 💡 Évolutions possibles

**1. Gestion de plusieurs cadres**

- Créer un cadre avec un nom et un identifiant unique.
- Générer un code d'invitation sécurisé et un QR code.
- Rejoindre un cadre par QR code ou saisie du code.

**2. Sécurisation des accès**

- Vérifier les invitations côté serveur.
- Utiliser un JWT dans un cookie HttpOnly.
- Empêcher l'accès aux cadres non autorisés.

**3. Évolution de la base de données**

- Introduire une collection de cadres.
- Associer chaque photo à son cadre.
- Préserver et migrer les données existantes.

**4. Communication en temps réel**

- Exploiter les rooms de Socket.IO.
- Vérifier les autorisations lors de la connexion.
- Diffuser les photos uniquement au cadre concerné.

## 🤖 Comment aborder ces évolutions avec l'IA ?

- Créer une branche Git dédiée.
- Demander à votre agent d'analyser l'existant et d'identifier les impacts.
- Actualiser vos fichiers `SPEC.md`, `TASKS.md` et `AGENTS.md` si nécessaire.
- Faire établir un plan d'implémentation et le valider.
- Avancer progressivement : implémenter, tester, valider, committer.

⚠️ Votre agent doit faire évoluer l'application, pas la reconstruire.

## 🛠️ Quelques pistes techniques

- `qrcode` pour générer les QR codes.
- Middleware Express pour contrôler les accès.
- `io.use()`, `socket.join()` et `io.to().emit()` pour Socket.IO.
- Script de migration pour les données MongoDB existantes.

**Le challenge du jour : passer de la création d'une application avec l'IA à sa maintenance et à son évolution.**
