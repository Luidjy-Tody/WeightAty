/* DONNÉES FICTIVES */
window.WAT = window.WAT || {};
WAT.seed = (() => {
  const date = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10); };
  const users = [
    {id:'marie',firstName:'Marie',lastName:'Noël',name:'Marie Noël',initials:'MN',location:'Port-Louis, Maurice',about:'Voyageuse régulière entre Maurice et la France.',email:'marie.demo@example.com',phone:'+230 5000 0000',rating:4.9,completed:12,since:'2024'},
    {id:'jean',name:'Jean M.',initials:'JM',rating:4.9,completed:18,since:'2024',location:'Maurice',about:'Voyageur régulier entre Maurice et Paris.'},
    {id:'sarah',name:'Sarah L.',initials:'SL',rating:4.8,completed:11,since:'2024',location:'Paris',about:'Je voyage régulièrement au Canada.'},
    {id:'david',name:'David R.',initials:'DR',rating:5,completed:27,since:'2024',location:'Lyon',about:'Heureux de faciliter vos petits envois.'},
    {id:'amelie',name:'Amélie P.',initials:'AP',rating:4.9,completed:9,since:'2024',location:'Maurice',about:'Voyageuse entre Maurice et le Royaume-Uni.'},
    {id:'nadia',name:'Nadia B.',initials:'NB',rating:4.8,completed:4,since:'2025',location:'Maurice',about:'Expéditrice de petits colis.'}
  ];
  const trips = [
    {id:'TRA-1',ownerId:'jean',from:'Maurice',to:'Paris',date:date(24),capacity:8,pickup:'Port-Louis, jusqu’à 24 heures avant le départ',delivery:'Paris, 15e arrondissement',notes:'Colis soigneusement emballé.',status:'Publié'},
    {id:'TRA-2',ownerId:'sarah',from:'Paris',to:'Montréal',date:date(30),capacity:5,pickup:'Paris 11e, place de la République',delivery:'Montréal, quartier Plateau-Mont-Royal',notes:'Documents et petits colis acceptés.',status:'Publié'},
    {id:'TRA-3',ownerId:'david',from:'Lyon',to:'Maurice',date:date(36),capacity:12,pickup:'Lyon, gare Part-Dieu',delivery:'Port-Louis, centre-ville',notes:'Prévoir un emballage solide.',status:'Publié'},
    {id:'TRA-4',ownerId:'amelie',from:'Maurice',to:'Londres',date:date(44),capacity:6,pickup:'Curepipe, centre-ville',delivery:'Londres, King’s Cross',notes:'Remise sur rendez-vous.',status:'Publié'},
    {id:'MT-1',ownerId:'marie',from:'Maurice',to:'Paris',date:date(24),capacity:8,pickup:'Port-Louis, centre-ville',delivery:'Paris, 15e arrondissement',notes:'Remise 24 heures avant le départ.',status:'Publié'}
  ];
  return {version:1,currentUserId:'marie',users,trips,parcels:[
    {id:'WAT-1048',ownerId:'marie',tripId:'TRA-1',type:'Vêtements',description:'Vêtements et livres dans un petit carton.',weight:2.5,value:1500,length:30,width:20,height:15,photo:'',createdAt:date(-2),status:'Brouillon'},
    {id:'WAT-0931',ownerId:'marie',tripId:'TRA-2',type:'Documents',description:'Dossier administratif fictif.',weight:0.8,value:100,length:32,width:24,height:3,photo:'',createdAt:date(-3),status:'Accepté'},
    {id:'WAT-0814',ownerId:'marie',tripId:'TRA-3',type:'Électronique',description:'Petit appareil photo de démonstration.',weight:1.2,value:3000,length:20,width:15,height:12,photo:'',createdAt:date(-30),status:'Livré'},
    {id:'WAT-2001',ownerId:'nadia',tripId:'MT-1',type:'Documents',description:'Livres et documents fictifs.',weight:1,value:500,length:25,width:20,height:5,photo:'',createdAt:date(-1),status:'En attente'}
  ],requests:[
    {id:'DEM-204',parcelId:'WAT-0931',tripId:'TRA-2',senderId:'marie',createdAt:date(-2),status:'Acceptée'},
    {id:'DEM-205',parcelId:'WAT-2001',tripId:'MT-1',senderId:'nadia',createdAt:date(-1),status:'En attente'}
  ],notifications:[
    {id:'NOT-1',userId:'marie',text:'Nouvelle demande reçue de Nadia B.',route:'/demandes-recues',date:date(-1),read:false},
    {id:'NOT-2',userId:'marie',text:'Votre demande DEM-204 a été acceptée.',route:'/demande/DEM-204',date:date(-2),read:false}
  ],draft:null,search:{from:'',to:'',date:'',minWeight:'',sort:'date'}};
})();
