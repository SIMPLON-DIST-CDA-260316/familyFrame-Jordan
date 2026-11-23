// Point d'entrée du backend : remplacé par le serveur Express en T03.
const port: number = Number(process.env.PORT ?? 3000);
console.log(`backend prêt (port ${port})`);
