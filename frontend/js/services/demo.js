/* STOCKAGE LOCAL DE DÉMONSTRATION */
WAT.store = (() => {
  const key = 'weight-aty-demo-v1';
  let state;
  let persistent = true;
  const clone = value => JSON.parse(JSON.stringify(value));
  try {
    const saved = WAT.backend ? null : JSON.parse(localStorage.getItem(key) || 'null');
    state = saved && saved.version === 1 && Array.isArray(saved.trips) && Array.isArray(saved.parcels) && Array.isArray(saved.requests) && Array.isArray(saved.users) && Array.isArray(saved.notifications) ? saved : clone(WAT.seed || {});
  } catch { state = clone(WAT.seed || {}); persistent = false; }
  function save() {
    try { localStorage.setItem(key,JSON.stringify(state)); persistent = true; }
    catch { persistent = false; }
  }
  return {
    read: () => clone(state),
    update(fn) { const next = clone(state); const result = fn(next); state = next; save(); return clone(result ?? state); },
    reset() { state = clone(WAT.seed || {}); save(); },
    isPersistent: () => persistent,
    id: prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2,8))
  };
})();
/* SERVICES DE DÉMONSTRATION */
WAT.mock = (() => {
  const read = () => WAT.store.read();
  const me = () => read().currentUserId;
  const requiredUser = () => {if(!me()) throw new Error('Ouvrez le profil de démonstration pour continuer.'); return me();};
  const notification = (s,userId,text,route) => s.notifications.unshift({id:WAT.store.id('NOT'),userId,text,route,date:WAT.validation.today(),read:false});
  const find = (list,id) => {const item=list.find(x=>x.id===id);if(!item) throw new Error('Élément introuvable.');return item;};
  const normalize = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  function filterTrips(trips,filters={}) {
    return trips.filter(t=>t.status==='Publié' && t.date>=WAT.validation.today() &&
      normalize(t.from).includes(normalize(filters.from)) && normalize(t.to).includes(normalize(filters.to)) &&
      (!filters.date || t.date===filters.date) && Number(t.capacity)>=Math.max(0,Number(filters.minWeight)||0))
      .sort(filters.sort==='weight' ? (a,b)=>b.capacity-a.capacity : (a,b)=>a.date.localeCompare(b.date));
  }
  return {
    filterTrips,
    async getUser(id) {return read().users.find(u=>u.id===(id||me())) || null;},
    async getTrips(filters={}) {return filterTrips(read().trips,filters);},
    async getTrip(id) {return read().trips.find(t=>t.id===id) || null;},
    async getMyTrips() {return read().trips.filter(t=>t.ownerId===me());},
    async saveTrip(data,id) {
      const uid=requiredUser(); const errors=WAT.validation.trip(data); if(Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      return WAT.store.update(s=>{
        let trip=id ? find(s.trips,id) : {id:WAT.store.id('TRA'),ownerId:uid,status:'Publié'};
        if(trip.ownerId!==uid) throw new Error('Ce trajet ne vous appartient pas.');
        if(id && s.requests.some(r=>r.tripId===id && ['En attente','Acceptée'].includes(r.status))) throw new Error('Ce trajet a des demandes actives. Annulez-les avant de le modifier.');
        Object.assign(trip,data,{from:data.from.trim(),to:data.to.trim(),capacity:Number(data.capacity)});
        if(!id) s.trips.push(trip); return trip;
      });
    },
    async cancelTrip(id) {
      const uid=requiredUser(); return WAT.store.update(s=>{const t=find(s.trips,id);if(t.ownerId!==uid) throw new Error('Action non autorisée.');t.status='Annulé';
        s.requests.filter(r=>r.tripId===id && ['En attente','Acceptée'].includes(r.status)).forEach(r=>{r.status='Annulée';find(s.parcels,r.parcelId).status='Annulé';notification(s,r.senderId,'Le trajet associé à votre demande a été annulé.','/demande/'+r.id);});return t;});
    },
    async getParcels() {return read().parcels.filter(p=>p.ownerId===me());},
    async getParcel(id) {return read().parcels.find(p=>p.id===id && p.ownerId===me()) || null;},
    async getDraft() {return read().draft;},
    async saveDraft(data) {
      const uid=requiredUser(); return WAT.store.update(s=>{
        const trip=find(s.trips,data.tripId);const errors=WAT.validation.parcel(data,trip);if(Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        let parcel=data.id ? find(s.parcels,data.id) : null;
        if(parcel && (parcel.ownerId!==uid || parcel.status!=='Brouillon')) throw new Error('Ce colis ne peut plus être modifié.');
        parcel={...data,id:parcel?.id||WAT.store.id('WAT'),ownerId:uid,createdAt:parcel?.createdAt||WAT.validation.today(),status:'Brouillon'};
        for(const n of ['weight','value','length','width','height']) parcel[n]=Number(parcel[n]);
        const index=s.parcels.findIndex(p=>p.id===parcel.id);if(index<0) s.parcels.unshift(parcel);else s.parcels[index]=parcel;
        s.draft=parcel;return parcel;
      });
    },
    async getRequests(incoming=false) {const s=read();return s.requests.filter(r=>incoming ? s.trips.some(t=>t.id===r.tripId && t.ownerId===me()) : r.senderId===me());},
    async getRequest(id) {const s=read();return s.requests.find(r=>r.id===id && (r.senderId===me() || s.trips.some(t=>t.id===r.tripId && t.ownerId===me())))||null;},
    async getRequestParcel(id) {const r=await this.getRequest(id);return r ? read().parcels.find(p=>p.id===r.parcelId):null;},
    async sendRequest(parcelId) {
      const uid=requiredUser();return WAT.store.update(s=>{
        const p=find(s.parcels,parcelId);const trip=find(s.trips,p.tripId);
        if(p.ownerId!==uid) throw new Error('Ce colis ne vous appartient pas.');
        const existing=s.requests.find(r=>r.parcelId===p.id);if(existing) return existing;
        if(trip.ownerId===uid) throw new Error('Vous ne pouvez pas envoyer une demande sur votre propre trajet.');
        const errors=WAT.validation.parcel(p,trip);if(Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        const request={id:WAT.store.id('DEM'),parcelId:p.id,tripId:p.tripId,senderId:uid,status:'En attente',createdAt:WAT.validation.today()};
        s.requests.unshift(request);p.status='En attente';s.draft=null;
        notification(s,trip.ownerId,'Une nouvelle demande de transport est disponible.','/demande/'+request.id);
        notification(s,uid,'Votre demande a été simulée.','/demande/'+request.id);return request;
      });
    },
    async updateRequest(id,status) {
      const uid=requiredUser();return WAT.store.update(s=>{
        const r=find(s.requests,id),trip=find(s.trips,r.tripId),p=find(s.parcels,r.parcelId);
        if(status==='Annulée') {if(r.senderId!==uid || !['En attente','Acceptée'].includes(r.status)) throw new Error('Annulation impossible.');}
        else if(trip.ownerId!==uid || r.status!=='En attente' || !['Acceptée','Refusée'].includes(status)) throw new Error('Action impossible.');
        if(status==='Acceptée') {if(trip.status!=='Publié'||trip.date<WAT.validation.today()||p.weight>trip.capacity) throw new Error('La capacité du trajet est insuffisante ou le trajet n’est plus disponible.');trip.capacity=Number((trip.capacity-p.weight).toFixed(2));}
        if(status==='Annulée' && r.status==='Acceptée') trip.capacity+=p.weight;
        r.status=status;p.status=({'Acceptée':'Accepté','Refusée':'Refusé','Annulée':'Annulé'})[status];
        notification(s,r.senderId,'Votre demande est maintenant '+status.toLowerCase()+'.','/demande/'+r.id);return r;
      });
    },
    async getNotifications() {return read().notifications.filter(n=>n.userId===me());},
    async markNotificationsRead() {const uid=me();WAT.store.update(s=>s.notifications.forEach(n=>{if(n.userId===uid)n.read=true;}));},
    async updateProfile(data) {const uid=requiredUser();return WAT.store.update(s=>{const u=find(s.users,uid);for(const key of ['firstName','lastName','location','about','email','phone'])if(key in data)u[key]=data[key].trim();u.name=u.firstName+' '+u.lastName;u.initials=(u.firstName[0]||'')+(u.lastName[0]||'');return u;});},
    async openDemo() {WAT.store.update(s=>{s.currentUserId='marie';});},
    async logout() {WAT.store.update(s=>{s.currentUserId=null;s.draft=null;});},
    async getSearch() {return read().search;},
    async saveSearch(filters) {WAT.store.update(s=>{s.search=filters;});}
  };
})();

// SERVICE ACTIF POUR LA DÉMONSTRATION
WAT.services = WAT.backend || WAT.mock;

// METTRE À JOUR LES VALEURS, SANS RECRÉER LA PAGE HTML
WAT.page = {
  async tripSummary(trip) {
    const d = WAT.dom;
    const owner = await WAT.services.getUser(trip.ownerId);
    d.text('[data-trip-from]', trip.from);
    d.text('[data-trip-to]', trip.to);
    d.text('[data-trip-date]', d.date(trip.date));
    d.text('[data-trip-capacity]', d.number(trip.capacity) + ' kg');
    d.text('[data-trip-id]', trip.id);
    d.text('[data-owner-name]', owner?.name);
    d.text('[data-owner-initials]', owner?.initials);
    d.text('[data-owner-rating]', '★ ' + d.number(owner?.rating));
    d.text('[data-owner-completed]', d.number(owner?.completed) + ' trajets réalisés');
    d.text('[data-owner-description]', owner?.name + ' a réalisé ' + owner?.completed + ' trajets réalisés.');
    return owner;
  },

  parcel(parcel) {
    const d = WAT.dom;
    d.text('[data-parcel-type]', parcel.type);
    d.text('[data-parcel-id]', parcel.id);
    d.text('[data-parcel-weight]', d.number(parcel.weight) + ' kg');
    d.text('[data-parcel-dimensions]', [parcel.length, parcel.width, parcel.height].map(d.number).join(' × ') + ' cm');
    d.text('[data-parcel-value]', d.number(parcel.value) + ' MUR');
    d.text('[data-parcel-description]', parcel.description);
    const photo = document.querySelector('[data-parcel-photo]');
    if (photo) {
      photo.hidden = !parcel.photo;
      if (parcel.photo) photo.src = parcel.photo;
      else photo.removeAttribute('src');
    }
  },

  row(templateId) {
    return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
  }
};

// COMPTEUR DE NOTIFICATIONS DU PROFIL FICTIF
if (typeof document !== 'undefined' && !WAT.backend) WAT.dom.run(async function () {
  const user = await WAT.services.getUser();
  if (!user) return;
  WAT.dom.text('.account-nav .avatar', user.initials);
  const count = (await WAT.services.getNotifications()).filter(function (n) { return !n.read; }).length;
  document.querySelectorAll('.badge-count').forEach(function (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  });
});
